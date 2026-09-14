import type {Kysely} from 'kysely'
import type {Club} from '$lib/domain/types'
import type {Database} from '$lib/server/db/schema'

declare global {
  namespace App {
    interface Locals {
      db: Kysely<Database>
      /** Le club de l'URL, résolu depuis son slug. Absent hors des routes /[club]. */
      club?: Club
    }
    // ctx, caches et cf viennent de @sveltejs/adapter-cloudflare ; seul env
    // est à déclarer ici, à partir des types générés par `wrangler types`.
    interface Platform {
      env: Env
    }
  }
}

export {}
