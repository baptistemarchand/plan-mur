import {listClubs} from '$lib/server/repo/clubs'
import {EMPTY_WALL_SUMMARY, getWallSummaries} from '$lib/server/repo/walls'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({locals}) => {
  const [clubs, summaries] = await Promise.all([listClubs(locals.db), getWallSummaries(locals.db)])

  return {clubs: clubs.map(club => ({...club, ...(summaries[club.id] ?? EMPTY_WALL_SUMMARY)}))}
}
