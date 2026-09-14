import { getWall } from '$lib/server/repo/walls';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	lines: await getWall(locals.db, locals.club!)
});
