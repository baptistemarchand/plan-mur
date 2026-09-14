import { readFileSync } from 'node:fs';
import SQLite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Club, Route } from '$lib/domain/types';
import type { Atomic } from '../db/client';
import type { Database } from '../db/schema';
import { getClubBySlug, listClubs } from './clubs';
import { claimRoute, releaseRoute } from './openings';
import { getWall, listSessions, saveWall } from './walls';

// Ces tests valident les requêtes sur SQLite, pas les particularités de D1
// (absence de transaction interactive, exécution en lot). Ce qui passe ici
// n'est donc pas une garantie sur la cible Cloudflare.
const migration = readFileSync('migrations/0001_initial.sql', 'utf8');

let db: Kysely<Database>;
let atomic: Atomic;
let club: Club;

const route = (over: Partial<Route> & { id: string }): Route => ({
	color: 'bleu',
	grade: '6a',
	...over
});

beforeEach(async () => {
	const sqlite = new SQLite(':memory:');
	sqlite.pragma('foreign_keys = ON');
	sqlite.exec(migration);
	db = new Kysely<Database>({ dialect: new SqliteDialect({ database: sqlite }) });
	atomic = (build) =>
		db.transaction().execute(async (trx) => {
			for (const query of build(trx)) {
				await query.execute();
			}
		});

	await db
		.insertInto('club')
		.values({
			slug: 'picetcol',
			name: 'Pic et col',
			line_count: 3,
			max_lines: 24,
			password_hash: 'x',
			created_at: new Date().toISOString()
		})
		.execute();

	club = (await getClubBySlug(db, 'picetcol'))!;
});

describe('clubs', () => {
	it('résout un club par son slug', () => {
		expect(club).toMatchObject({ slug: 'picetcol', name: 'Pic et col', lineCount: 3, maxLines: 24 });
	});

	it('ne résout pas un slug inconnu', async () => {
		expect(await getClubBySlug(db, 'inconnu')).toBeUndefined();
	});

	it('trie les clubs par nom', async () => {
		await db
			.insertInto('club')
			.values({ slug: 'a', name: 'Alpha', password_hash: 'x', created_at: '2020' })
			.execute();
		expect((await listClubs(db)).map((c) => c.slug)).toEqual(['a', 'picetcol']);
	});
});

describe('getWall', () => {
	it('rend les lignes déclarées par le club, même vides', async () => {
		const wall = await getWall(db, club);
		expect(wall.lines).toEqual([[], [], []]);
		expect(wall.revision).toBe(0);
	});

	it("garde une ligne vide ajoutée par l'éditeur", async () => {
		await saveWall(db, atomic, club, [[route({ id: 'a' })], [], [], []], 0);
		expect((await getWall(db, club)).lines).toHaveLength(4);
	});

	it("place chaque voie sur sa ligne, dans l'ordre", async () => {
		await saveWall(db, atomic, club, [[route({ id: 'a' }), route({ id: 'b' })], [], [route({ id: 'c' })]], 0);
		const wall = await getWall(db, club);
		expect(wall.lines.map((line) => line.map((r) => r.id))).toEqual([['a', 'b'], [], ['c']]);
	});

	it('ne rend que les champs optionnels réellement posés', async () => {
		await saveWall(db, atomic, club, [[route({ id: 'a', setAt: '2025 oct', toRemove: true })]], 0);
		const [[saved]] = (await getWall(db, club)).lines;
		expect(saved).toEqual({ id: 'a', color: 'bleu', grade: '6a', setAt: '2025 oct', toRemove: true });
	});
});

describe('saveWall', () => {
	it('incrémente la révision', async () => {
		expect(await saveWall(db, atomic, club, [[route({ id: 'a' })]], 0)).toBe(1);
		expect((await getWall(db, club)).revision).toBe(1);
	});

	it('refuse une écriture fondée sur une révision périmée', async () => {
		await saveWall(db, atomic, club, [[route({ id: 'a' })]], 0);
		expect(await saveWall(db, atomic, club, [[route({ id: 'b' })]], 0)).toBeUndefined();
	});

	it('ne touche à rien quand la révision est périmée', async () => {
		await saveWall(db, atomic, club, [[route({ id: 'a' })]], 0);
		await saveWall(db, atomic, club, [[route({ id: 'b' })]], 0);
		expect((await getWall(db, club)).lines.flat().map((r) => r.id)).toEqual(['a']);
	});

	it('met à jour une voie existante sans la dupliquer', async () => {
		await saveWall(db, atomic, club, [[route({ id: 'a', grade: '6a' })]], 0);
		await saveWall(db, atomic, club, [[route({ id: 'a', grade: '7b' })]], 1);
		const routes = (await getWall(db, club)).lines.flat();
		expect(routes).toHaveLength(1);
		expect(routes[0].grade).toBe('7b');
	});

	it("déplace une voie d'une ligne à l'autre", async () => {
		await saveWall(db, atomic, club, [[route({ id: 'a' })], []], 0);
		await saveWall(db, atomic, club, [[], [route({ id: 'a' })]], 1);
		// Le mur suit ce que l'éditeur envoie : deux lignes envoyées, deux lignes rendues.
		expect((await getWall(db, club)).lines.map((l) => l.map((r) => r.id))).toEqual([[], ['a']]);
	});

	it('marque supprimée une voie absente du nouveau mur', async () => {
		await saveWall(db, atomic, club, [[route({ id: 'a' }), route({ id: 'b' })]], 0);
		await saveWall(db, atomic, club, [[route({ id: 'a' })]], 1);
		const routes = (await getWall(db, club)).lines.flat();
		expect(routes.find((r) => r.id === 'b')?.deleted).toBe(true);
	});

	it('marque supprimée toute voie quand le mur est vidé', async () => {
		await saveWall(db, atomic, club, [[route({ id: 'a' })]], 0);
		await saveWall(db, atomic, club, [[]], 1);
		expect((await getWall(db, club)).lines.flat()[0].deleted).toBe(true);
	});
});

// D1 plafonne le nombre de paramètres liés par requête, bien plus bas que
// SQLite. Un upsert multi-lignes passait en local et cassait en production.
describe('limites de D1', () => {
	const D1_BOUND_PARAMETER_BUDGET = 90;

	it('ne produit aucune requête au-delà du budget de paramètres', async () => {
		const captured: number[] = [];
		const spy: Atomic = (build) =>
			atomic((ex) => {
				const queries = build(ex);
				for (const query of queries) {
					captured.push(query.compile().parameters.length);
				}
				return queries;
			});

		const wide = Array.from({ length: 120 }, (_, i) => route({ id: `r${i}` }));
		await saveWall(db, spy, club, [wide], 0);

		expect(captured.length).toBeGreaterThan(0);
		expect(Math.max(...captured)).toBeLessThanOrEqual(D1_BOUND_PARAMETER_BUDGET);
	});

	it('émet une instruction par voie, plus une par orpheline', async () => {
		await saveWall(db, atomic, club, [[route({ id: 'a' }), route({ id: 'b' })]], 0);

		let count = 0;
		const spy: Atomic = (build) =>
			atomic((ex) => {
				const queries = build(ex);
				count = queries.length;
				return queries;
			});

		// Deux voies envoyées dont une nouvelle, une disparue : 2 upserts + 1 orpheline.
		await saveWall(db, spy, club, [[route({ id: 'a' }), route({ id: 'c' })]], 1);
		expect(count).toBe(3);
	});
});

describe('claimRoute', () => {
	beforeEach(async () => {
		await saveWall(db, atomic, club, [[route({ id: 'a', toOpen: true })]], 0);
	});

	it('inscrit un ouvreur sur une voie libre', async () => {
		expect(await claimRoute(db, club, 'a', 'seb')).toBe(true);
		expect((await getWall(db, club)).lines.flat()[0].author).toBe('seb');
	});

	it('refuse une voie déjà prise sans écraser le premier inscrit', async () => {
		await claimRoute(db, club, 'a', 'seb');
		expect(await claimRoute(db, club, 'a', 'lea')).toBe(false);
		expect((await getWall(db, club)).lines.flat()[0].author).toBe('seb');
	});

	it('libère une voie et la rend reprenable', async () => {
		await claimRoute(db, club, 'a', 'seb');
		await releaseRoute(db, club, 'a');
		expect(await claimRoute(db, club, 'a', 'lea')).toBe(true);
	});

	it('ignore une voie qui appartient à un autre club', async () => {
		expect(await claimRoute(db, { ...club, id: club.id + 1 }, 'a', 'seb')).toBe(false);
	});
});

describe('listSessions', () => {
	it('dédoublonne et rend les sessions les plus récentes en premier', async () => {
		await saveWall(db, atomic, club,
			[
				[route({ id: 'a', setAt: '2021 oct' }), route({ id: 'b', setAt: '2025 oct' })],
				[route({ id: 'c', setAt: '2021 oct' }), route({ id: 'd' })]
			],
			0
		);
		expect(await listSessions(db, club)).toEqual(['2025 oct', '2021 oct']);
	});
});
