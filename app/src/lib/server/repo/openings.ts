import type { Kysely } from 'kysely';
import type { Club } from '$lib/domain/types';
import type { Database } from '../db/schema';

/**
 * Inscrit un ouvreur, seulement si la voie est encore libre. La condition est
 * dans le UPDATE : deux personnes qui cliquent en même temps ne peuvent plus
 * s'écraser, et l'appelant sait laquelle a perdu.
 */
export const claimRoute = async (
	db: Kysely<Database>,
	club: Club,
	routeId: string,
	author: string
): Promise<boolean> => {
	const result = await db
		.updateTable('route')
		.set({ author, updated_at: new Date().toISOString() })
		.where('id', '=', routeId)
		.where('club_id', '=', club.id)
		.where('author', 'is', null)
		.executeTakeFirst();

	return Number(result.numUpdatedRows) > 0;
};

export const releaseRoute = async (
	db: Kysely<Database>,
	club: Club,
	routeId: string
): Promise<void> => {
	await db
		.updateTable('route')
		.set({ author: null, updated_at: new Date().toISOString() })
		.where('id', '=', routeId)
		.where('club_id', '=', club.id)
		.execute();
};
