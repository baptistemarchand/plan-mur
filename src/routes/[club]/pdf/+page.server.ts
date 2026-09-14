import {getWall, listSessions} from '$lib/server/repo/walls'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({locals}) => {
  const [lines, sessions] = await Promise.all([getWall(locals.db, locals.club!), listSessions(locals.db, locals.club!)])
  return {lines, sessions}
}
