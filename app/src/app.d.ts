import type { Club } from '$lib/domain/types';
import type { Atomic, Db } from '$lib/server/db/client';

declare global {
	namespace App {
		interface Locals {
			db: Db['kysely'];
			atomic: Atomic;
			/** Le club de l'URL, résolu depuis son slug. Absent hors des routes /[club]. */
			club?: Club;
		}
		// ctx, caches et cf viennent de @sveltejs/adapter-cloudflare ; seul env
		// est à déclarer ici, à partir des types générés par `wrangler types`.
		interface Platform {
			env: Env;
		}
	}
}

export {};
