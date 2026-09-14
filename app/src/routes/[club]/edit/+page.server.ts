import { getWall } from '$lib/server/repo/walls';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => getWall(locals.db, locals.club!);
