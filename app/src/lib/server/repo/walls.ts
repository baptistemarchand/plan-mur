import type { Kysely } from 'kysely';
import type { Club, Route, Wall } from '$lib/domain/types';
import type { Atomic, AtomicQuery } from '../db/client';
import type { Database, NewRouteRow, RouteRow } from '../db/schema';

const toRoute = (row: RouteRow): Route => ({
	id: row.id,
	color: row.color,
	grade: row.grade,
	...(row.set_at ? { setAt: row.set_at } : {}),
	...(row.author ? { author: row.author } : {}),
	...(row.to_remove ? { toRemove: true } : {}),
	...(row.to_open ? { toOpen: true } : {}),
	...(row.deleted ? { deleted: true } : {})
});

const toRow = (
	route: Route,
	clubId: number,
	lineIndex: number,
	position: number,
	now: string
): NewRouteRow => ({
	id: route.id,
	club_id: clubId,
	line_index: lineIndex,
	position,
	color: route.color,
	grade: route.grade,
	set_at: route.setAt ?? null,
	author: route.author ?? null,
	to_remove: route.toRemove ? 1 : 0,
	to_open: route.toOpen ? 1 : 0,
	deleted: route.deleted ? 1 : 0,
	deleted_at: null,
	updated_at: now
});

/**
 * Le mur tel que l'UI le consomme : un tableau par ligne physique, y compris
 * les lignes vides. C'est la forme historique, conservée pour que les pages et
 * l'éditeur ignorent la normalisation du stockage.
 */
export const getWall = async (db: Kysely<Database>, club: Club): Promise<Wall> => {
	const rows = await db
		.selectFrom('route')
		.selectAll()
		.where('club_id', '=', club.id)
		.orderBy('line_index')
		.orderBy('position')
		.execute();

	// Relu en base plutôt que pris sur le Club reçu : saveWall fait bouger les
	// deux, et un appelant pourrait travailler sur un instantané périmé.
	const current = await db
		.selectFrom('club')
		.select(['revision', 'line_count'])
		.where('id', '=', club.id)
		.executeTakeFirstOrThrow();

	const lineCount = Math.max(current.line_count, ...rows.map((row) => row.line_index + 1), 0);
	const lines: Route[][] = Array.from({ length: lineCount }, () => []);
	for (const row of rows) {
		lines[row.line_index].push(toRoute(row));
	}

	return { lines, revision: current.revision };
};

/**
 * Remplace le mur, à condition que personne ne l'ait modifié entre-temps.
 * Rend la nouvelle révision, ou undefined en cas de conflit.
 *
 * Deux temps, parce que D1 ne propose pas de transaction interactive et qu'on
 * a besoin du résultat de la prise de révision avant d'écrire la suite :
 *
 *   1. prendre la révision, en une instruction conditionnelle donc atomique ;
 *   2. écrire les voies, groupées.
 *
 * Si le processus meurt entre les deux, la révision a avancé sans que le mur
 * change : les autres éditeurs reçoivent un 409 et rechargent des données
 * justes. On échange un conflit inutile contre l'absence de corruption.
 */
export const saveWall = async (
	db: Kysely<Database>,
	atomic: Atomic,
	club: Club,
	lines: Route[][],
	expectedRevision: number
): Promise<number | undefined> => {
	const bumped = await db
		.updateTable('club')
		.set((eb) => ({ revision: eb('revision', '+', 1), line_count: lines.length }))
		.where('id', '=', club.id)
		.where('revision', '=', expectedRevision)
		.executeTakeFirst();

	if (Number(bumped.numUpdatedRows) === 0) {
		return undefined;
	}

	const now = new Date().toISOString();
	const rows = lines.flatMap((line, lineIndex) =>
		line.map((route, position) => toRow(route, club.id, lineIndex, position, now))
	);

	// Les voies orphelines sont identifiées ici, pas dans un NOT IN : la liste
	// des identifiants dépasserait le plafond de paramètres liés de D1. La
	// révision vient d'être prise, personne d'autre n'écrit entre-temps.
	const sent = new Set(rows.map((row) => row.id));
	const orphans = (
		await db
			.selectFrom('route')
			.select('id')
			.where('club_id', '=', club.id)
			.where('deleted', '=', 0)
			.execute()
	)
		.map((row) => row.id)
		.filter((id) => !sent.has(id));

	await atomic((ex) => {
		// Une instruction par voie plutôt qu'un upsert multi-lignes : D1 plafonne
		// le nombre de paramètres liés par requête, très bas, et 119 voies à
		// treize colonnes le dépassaient largement. better-sqlite3 ne s'en
		// plaignait pas, d'où un bug invisible hors de workerd.
		const queries: AtomicQuery[] = rows.map((row) =>
			ex
				.insertInto('route')
				.values(row)
				.onConflict((oc) =>
					oc.column('id').doUpdateSet((eb) => ({
						line_index: eb.ref('excluded.line_index'),
						position: eb.ref('excluded.position'),
						color: eb.ref('excluded.color'),
						grade: eb.ref('excluded.grade'),
						set_at: eb.ref('excluded.set_at'),
						author: eb.ref('excluded.author'),
						to_remove: eb.ref('excluded.to_remove'),
						to_open: eb.ref('excluded.to_open'),
						deleted: eb.ref('excluded.deleted'),
						updated_at: eb.ref('excluded.updated_at')
					}))
				)
		);

		// Une voie absente du payload a disparu côté éditeur : on la marque
		// supprimée plutôt que de la perdre, comme le faisait le soft delete.
		for (const id of orphans) {
			queries.push(
				ex
					.updateTable('route')
					.set({ deleted: 1, deleted_at: now, updated_at: now })
					.where('id', '=', id)
			);
		}

		return queries;
	});

	return expectedRevision + 1;
};

/** Sessions d'ouverture connues, les plus récentes d'abord. */
export const listSessions = async (db: Kysely<Database>, club: Club): Promise<string[]> => {
	const rows = await db
		.selectFrom('route')
		.select('set_at')
		.distinct()
		.where('club_id', '=', club.id)
		.where('set_at', 'is not', null)
		.execute();

	return rows
		.map((row) => row.set_at as string)
		.sort((a, b) => b.localeCompare(a, 'fr', { numeric: true }));
};
