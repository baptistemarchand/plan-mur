import { error, type Handle } from '@sveltejs/kit';
import { getDb } from '$lib/server/db/client';
import { getClubBySlug } from '$lib/server/repo/clubs';

export const handle: Handle = async ({ event, resolve }) => {
	const { kysely, atomic } = await getDb(event.platform);
	event.locals.db = kysely;
	event.locals.atomic = atomic;

	const slug = event.params.club;
	if (slug) {
		const club = await getClubBySlug(event.locals.db, slug);
		if (!club) {
			error(404, `Club inconnu : ${slug}`);
		}
		event.locals.club = club;
	}

	return resolve(event);
};
