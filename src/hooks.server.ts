import { error, type Handle } from '@sveltejs/kit';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import { getClubBySlug } from '$lib/server/repo/clubs';
import type { Database } from '$lib/server/db/schema';

// Seul endroit du projet qui connaît la plateforme d'exécution. Tout le reste
// travaille sur un Kysely<Database>, et le SQL reste du SQLite : D1 est un
// driver, pas un modèle de données.
export const handle: Handle = async ({ event, resolve }) => {
	const binding = event.platform?.env?.DB;
	if (!binding) {
		error(500, 'Base D1 non liée : vérifier le binding DB de wrangler.jsonc.');
	}

	event.locals.db = new Kysely<Database>({ dialect: new D1Dialect({ database: binding }) });

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
