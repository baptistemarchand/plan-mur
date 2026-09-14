import type { LayoutServerLoad } from './$types';

// Le club est résolu une fois dans hooks.server.ts, à partir du slug de l'URL.
export const load: LayoutServerLoad = async ({ locals }) => ({ club: locals.club! });
