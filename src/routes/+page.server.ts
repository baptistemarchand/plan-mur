import {listClubs} from '$lib/server/repo/clubs'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({locals}) => ({
  clubs: await listClubs(locals.db),
})
