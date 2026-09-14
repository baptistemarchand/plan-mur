import { Kysely, SqliteDialect, type Compilable, type Dialect } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { env } from '$env/dynamic/private';
import type { Database } from './schema';

// Seul fichier du projet autorisé à connaître la plateforme d'exécution.
// Tout le reste travaille sur un Kysely<Database> et un Atomic, identiques
// quel que soit le driver. Passer de Cloudflare à un serveur Node se joue ici.

/**
 * Exécute plusieurs écritures en une unité atomique.
 *
 * C'est la seule divergence réelle entre les deux cibles : better-sqlite3 a des
 * transactions interactives, D1 n'en a aucune et ne sait que grouper des
 * instructions préparées. D'où la forme : on décrit les requêtes, on ne pilote
 * pas la transaction.
 */
/** Une requête Kysely, décrite puis exécutée ou compilée selon la cible. */
export type AtomicQuery = Compilable<unknown> & { execute(): Promise<unknown> };

export type Atomic = (build: (ex: Kysely<Database>) => AtomicQuery[]) => Promise<void>;

export type Db = { kysely: Kysely<Database>; atomic: Atomic };

let connection: Db | undefined;

// Spécificateur calculé et @vite-ignore : better-sqlite3 est un module natif
// dont le chargeur de binding est du CommonJS. Empaqueté, il casse côté Node ;
// et il n'a rien à faire dans le bundle Worker, où cette branche n'est jamais
// atteinte. On le laisse donc se résoudre à l'exécution.
const NODE_DRIVER = 'better-sqlite3';

const nodeDb = async (): Promise<Db> => {
	const { default: SQLite } = await import(/* @vite-ignore */ NODE_DRIVER);
	const database = new SQLite(env.DATABASE_PATH ?? 'local.db');
	database.pragma('foreign_keys = ON');
	const kysely = new Kysely<Database>({ dialect: new SqliteDialect({ database }) as Dialect });

	return {
		kysely,
		atomic: (build) =>
			kysely.transaction().execute(async (trx) => {
				for (const query of build(trx)) {
					await query.execute();
				}
			})
	};
};

const d1Db = (database: D1Database): Db => {
	const kysely = new Kysely<Database>({ dialect: new D1Dialect({ database }) });

	return {
		kysely,
		atomic: async (build) => {
			const statements = build(kysely).map((query) => {
				const { sql, parameters } = query.compile();
				return database.prepare(sql).bind(...parameters);
			});
			if (statements.length > 0) {
				await database.batch(statements);
			}
		}
	};
};

export const getDb = async (platform?: Readonly<App.Platform>): Promise<Db> => {
	const binding = platform?.env?.DB;
	if (binding) {
		// Pas de cache : le binding appartient à la requête, pas au processus.
		return d1Db(binding);
	}
	connection ??= await nodeDb();
	return connection;
};
