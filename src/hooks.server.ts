import {error, type Handle} from '@sveltejs/kit'
import {Kysely} from 'kysely'
import {D1Dialect} from 'kysely-d1'
import {getClubBySlug} from '$lib/server/repo/clubs'
import type {Database} from '$lib/server/db/schema'

export const handle: Handle = async ({event, resolve}) => {
  const binding = event.platform?.env?.DB
  if (!binding) {
    error(500, 'Base D1 non liée : vérifier le binding DB de wrangler.jsonc.')
  }

  event.locals.db = new Kysely<Database>({dialect: new D1Dialect({database: binding})})

  const slug = event.params.club
  if (slug) {
    const club = await getClubBySlug(event.locals.db, slug)
    if (!club) {
      error(404, `Club inconnu : ${slug}`)
    }
    event.locals.club = club
  }

  const response = await resolve(event)

  // HTML revalidé à chaque visite, sinon une page en cache réclame les scripts d'un build disparu.
  if (response.headers.get('content-type')?.startsWith('text/html') && !response.headers.has('cache-control')) {
    response.headers.set('cache-control', 'no-cache')
  }

  return response
}
