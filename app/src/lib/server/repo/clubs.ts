import type { Kysely } from 'kysely';
import type { Club } from '$lib/domain/types';
import type { ClubRow, Database } from '../db/schema';

// Projection volontaire : passwordHash et revision ne quittent pas le serveur.
const toClub = ({ id, slug, name, lineCount, maxLines }: ClubRow): Club => ({
	id,
	slug,
	name,
	lineCount,
	maxLines
});

export const listClubs = async (db: Kysely<Database>): Promise<Club[]> => {
	const rows = await db.selectFrom('club').selectAll().where('deletedAt', 'is', null).execute();
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
		.where('deletedAt', 'is', null)
		.executeTakeFirst();
	return row && toClub(row);
};

export const getPasswordHash = async (
	db: Kysely<Database>,
	clubId: number
): Promise<string | undefined> => {
	const row = await db
		.selectFrom('club')
		.select('passwordHash')
		.where('id', '=', clubId)
		.executeTakeFirst();
	return row?.passwordHash;
};
