import type { Kysely } from 'kysely';
import type { Club } from '$lib/domain/types';
import type { ClubRow, Database } from '../db/schema';

const toClub = (row: ClubRow): Club => ({
	id: row.id,
	slug: row.slug,
	name: row.name,
	lineCount: row.line_count,
	maxLines: row.max_lines
});

export const listClubs = async (db: Kysely<Database>): Promise<Club[]> => {
	const rows = await db.selectFrom('club').selectAll().execute();
	return rows.map(toClub).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
};

export const getClubBySlug = async (
	db: Kysely<Database>,
	slug: string
): Promise<Club | undefined> => {
	const row = await db
		.selectFrom('club')
		.selectAll()
		.where('slug', '=', slug)
		.executeTakeFirst();
	return row && toClub(row);
};

export const getPasswordHash = async (
	db: Kysely<Database>,
	clubId: number
): Promise<string | undefined> => {
	const row = await db
		.selectFrom('club')
		.select('password_hash')
		.where('id', '=', clubId)
		.executeTakeFirst();
	return row?.password_hash;
};
