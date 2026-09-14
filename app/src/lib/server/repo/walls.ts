import type { Kysely } from 'kysely';
import type { Club, Route } from '$lib/domain/types';
import type { Database, NewRouteRow, RouteRow } from '../db/schema';

export type PositionedRoute = Route & { lineIndex: number; position: number };

const toRoute = ({ toRemove, toOpen, ...row }: RouteRow): Route => ({
	id: row.id,
	color: row.color,
	grade: row.grade,
	setAt: row.setAt,
	author: row.author,
	toRemove: !!toRemove,
	toOpen: !!toOpen,
	deletedAt: row.deletedAt
});

const toRow = (route: PositionedRoute, clubId: number, now: string): NewRouteRow => ({
	...route,
	clubId,
	toRemove: route.toRemove ? 1 : 0,
	toOpen: route.toOpen ? 1 : 0,
	updatedAt: now
});

/**
 * Le mur tel que l'UI le consomme : un tableau par ligne physique, y compris
 * les lignes vides. C'est la forme historique, conservée pour que les pages et
 * l'éditeur ignorent la normalisation du stockage.
 */
export const getWall = async (db: Kysely<Database>, club: Club): Promise<Route[][]> => {
	const rows = await db
		.selectFrom('route')
		.selectAll()
		.where('clubId', '=', club.id)
		.orderBy('lineIndex')
		.orderBy('position')
		.execute();

	const lineCount = Math.max(0, ...rows.map((row) => row.lineIndex + 1));
	const lines: Route[][] = Array.from({ length: lineCount }, () => []);
	for (const row of rows) {
		lines[row.lineIndex].push(toRoute(row));
	}

	return lines;
};

export const saveRoute = async (
	db: Kysely<Database>,
	club: Club,
	route: PositionedRoute
): Promise<boolean> => {
	const now = new Date().toISOString();

	const written = await db
		.insertInto('route')
		.values(toRow(route, club.id, now))
		.onConflict((oc) =>
			oc
				.column('id')
				.doUpdateSet((eb) => ({
					lineIndex: eb.ref('excluded.lineIndex'),
					position: eb.ref('excluded.position'),
					color: eb.ref('excluded.color'),
					grade: eb.ref('excluded.grade'),
					setAt: eb.ref('excluded.setAt'),
					author: eb.ref('excluded.author'),
					toRemove: eb.ref('excluded.toRemove'),
					toOpen: eb.ref('excluded.toOpen'),
					deletedAt: eb.ref('excluded.deletedAt'),
					updatedAt: eb.ref('excluded.updatedAt')
				}))
				.where('route.clubId', '=', club.id)
		)
		.executeTakeFirst();

	return Number(written.numInsertedOrUpdatedRows) > 0;
};

/** Sessions d'ouverture connues, les plus récentes d'abord. */
export const listSessions = async (db: Kysely<Database>, club: Club): Promise<string[]> => {
	const rows = await db
		.selectFrom('route')
		.select('setAt')
		.distinct()
		.where('clubId', '=', club.id)
		.where('setAt', 'is not', null)
		.execute();

	return rows
		.map((row) => row.setAt as string)
		.sort((a, b) => b.localeCompare(a, 'fr', { numeric: true }));
};
