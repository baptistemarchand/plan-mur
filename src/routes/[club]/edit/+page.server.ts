import {redirect} from '@sveltejs/kit'
import {isAuthenticated} from '$lib/server/session'
import {getWall} from '$lib/server/repo/walls'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async event => {
  if (!(await isAuthenticated(event))) {
    redirect(303, `/${event.params.club}/login?next=${encodeURIComponent(event.url.pathname)}`)
  }

  return {lines: await getWall(event.locals.db, event.locals.club!)}
}
