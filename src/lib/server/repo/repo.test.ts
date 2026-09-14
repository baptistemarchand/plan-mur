import { readFileSync } from 'node:fs';
import SQLite from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Club, Route } from '$lib/domain/types';
import type { Database } from '../db/schema';
import { getClubBySlug, listClubs } from './clubs';
import { claimRoute, releaseRoute } from './openings';
import { getWall, listSessions, saveRoute, type PositionedRoute } from './walls';

// Ces tests valident les requêtes sur SQLite, pas les particularités de D1
// (absence de transaction interactive, exécution en lot). Ce qui passe ici
// n'est donc pas une garantie sur la cible Cloudflare.
const migration = readFileSync('migrations/0001_initial.sql', 'utf8');

let db: Kysely<Database>;
let club: Club;

const route = (over: Partial<PositionedRoute> & { id: string }): PositionedRoute => ({
	color: 'bleu',
	grade: '6a',
	setAt: null,
	author: null,
	toRemove: false,
	toOpen: false,
	deletedAt: null,
	lineIndex: 0,
	position: 0,
	...over
});

const put = (over: Partial<PositionedRoute> & { id: string }) => saveRoute(db, club, route(over));

const ids = (lines: Route[][]) => lines.map((line) => line.map((r) => r.id));

beforeEach(async () => {
	const sqlite = new SQLite(':memory:');
	sqlite.pragma('foreign_keys = ON');
	sqlite.exec(migration);
	db = new Kysely<Database>({ dialect: new SqliteDialect({ database: sqlite }) });

	await db
		.insertInto('club')
		.values({
			slug: 'picetcol',
			name: 'Pic et col',
			maxLines: 24,
			passwordHash: 'x',
			createdAt: new Date().toISOString(),
			deletedAt: null
		})
		.execute();

	club = (await getClubBySlug(db, 'picetcol'))!;
});

describe('clubs', () => {
	it('résout un club par son slug', () => {
		expect(club).toMatchObject({ slug: 'picetcol', name: 'Pic et col', maxLines: 24 });
	});

	it('ne résout pas un slug inconnu', async () => {
		expect(await getClubBySlug(db, 'inconnu')).toBeUndefined();
	});

	it('trie les clubs par nom', async () => {
		await db
			.insertInto('club')
			.values({ slug: 'a', name: 'Alpha', passwordHash: 'x', createdAt: '2020', deletedAt: null })
			.execute();
		expect((await listClubs(db)).map((c) => c.slug)).toEqual(['a', 'picetcol']);
	});
});

describe('clubs supprimés', () => {
	beforeEach(async () => {
		await db
			.updateTable('club')
			.set({ deletedAt: new Date().toISOString() })
			.where('id', '=', club.id)
			.execute();
	});

	it('ne liste pas un club supprimé', async () => {
		expect(await listClubs(db)).toEqual([]);
	});

	it("ne résout pas le slug d'un club supprimé", async () => {
		expect(await getClubBySlug(db, 'picetcol')).toBeUndefined();
	});
});

describe('getWall', () => {
	it("rend un mur vide quand le club n'a aucune voie", async () => {
		expect(await getWall(db, club)).toEqual([]);
	});

	it("place chaque voie sur sa ligne, dans l'ordre", async () => {
		await put({ id: 'b', lineIndex: 0, position: 1 });
		await put({ id: 'a', lineIndex: 0, position: 0 });
		await put({ id: 'c', lineIndex: 2, position: 0 });
		expect(ids(await getWall(db, club))).toEqual([['a', 'b'], [], ['c']]);
	});

	// Le nombre de lignes se déduit des voies : une ligne ajoutée dans
	// l'éditeur et laissée vide n'existe nulle part en base.
	it("ne garde pas une ligne restée vide", async () => {
		await put({ id: 'a', lineIndex: 0 });
		expect(await getWall(db, club)).toHaveLength(1);
	});

	it('garde une ligne dont toutes les voies sont supprimées', async () => {
		await put({ id: 'a', lineIndex: 0 });
		await put({ id: 'b', lineIndex: 1, deletedAt: '2024-03-02T10:00:00.000Z' });
		expect(await getWall(db, club)).toHaveLength(2);
	});

	it('rend une voie dans la forme exacte du domaine', async () => {
		await put({ id: 'a', setAt: '2025 oct', toRemove: true });
		const [[saved]] = await getWall(db, club);
		expect(saved).toEqual({
			id: 'a',
			color: 'bleu',
			grade: '6a',
			setAt: '2025 oct',
			author: null,
			toRemove: true,
			toOpen: false,
			deletedAt: null
		});
	});
});

describe('saveRoute', () => {
	it('crée une voie absente', async () => {
		expect(await put({ id: 'a' })).toBe(true);
		expect(ids(await getWall(db, club))).toEqual([['a']]);
	});

	it('met à jour une voie existante sans la dupliquer', async () => {
		await put({ id: 'a', grade: '6a' });
		await put({ id: 'a', grade: '7b' });
		const routes = (await getWall(db, club)).flat();
		expect(routes).toHaveLength(1);
		expect(routes[0].grade).toBe('7b');
	});

	it("déplace une voie d'une ligne à l'autre", async () => {
		await put({ id: 'a', lineIndex: 0 });
		await put({ id: 'a', lineIndex: 1 });
		expect(ids(await getWall(db, club))).toEqual([[], ['a']]);
	});

	// Le conflit d'upsert porte sur route.id seul : sans le garde-fou sur
	// clubId, un identifiant deviné ferait migrer la voie d'un club à l'autre.
	it("refuse un identifiant qui appartient à un autre club", async () => {
		await put({ id: 'a' });
		const autre: Club = { ...club, id: club.id + 1 };

		expect(await saveRoute(db, autre, route({ id: 'a', grade: '9c' }))).toBe(false);
		expect((await getWall(db, club)).flat()[0].grade).toBe('6a');
	});

	it("n'écrase pas les autres voies de la ligne", async () => {
		await put({ id: 'a', position: 0, author: 'seb' });
		await put({ id: 'b', position: 1 });
		expect((await getWall(db, club)).flat()[0].author).toBe('seb');
	});
});

describe('suppression logique', () => {
	const DELETED_ON = '2024-03-02T10:00:00.000Z';

	const deletionDate = async (id: string) =>
		(await db.selectFrom('route').select('deletedAt').where('id', '=', id).executeTakeFirst())
			?.deletedAt;

	// C'est l'éditeur qui horodate. Le serveur écrit ce qu'il reçoit, sans
	// jamais remettre la date à l'heure en chemin.
	it('écrit la date reçue, sans la réinterpréter', async () => {
		await put({ id: 'a', deletedAt: DELETED_ON });
		expect(await deletionDate('a')).toBe(DELETED_ON);
	});

	it('efface la date si la voie revient au mur', async () => {
		await put({ id: 'a', deletedAt: DELETED_ON });
		await put({ id: 'a' });
		expect(await deletionDate('a')).toBeNull();
	});
});

describe('claimRoute', () => {
	beforeEach(async () => {
		await put({ id: 'a', toOpen: true });
	});

	it('inscrit un ouvreur sur une voie libre', async () => {
		expect(await claimRoute(db, club, 'a', 'seb')).toBe(true);
		expect((await getWall(db, club)).flat()[0].author).toBe('seb');
	});

	it('refuse une voie déjà prise sans écraser le premier inscrit', async () => {
		await claimRoute(db, club, 'a', 'seb');
		expect(await claimRoute(db, club, 'a', 'lea')).toBe(false);
		expect((await getWall(db, club)).flat()[0].author).toBe('seb');
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
		await put({ id: 'a', setAt: '2021 oct' });
		await put({ id: 'b', setAt: '2025 oct', position: 1 });
		await put({ id: 'c', setAt: '2021 oct', lineIndex: 1 });
		await put({ id: 'd', lineIndex: 1, position: 1 });
		expect(await listSessions(db, club)).toEqual(['2025 oct', '2021 oct']);
	});
});
