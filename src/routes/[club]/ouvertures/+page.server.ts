import { fail, redirect } from '@sveltejs/kit';
import { plannedRoutes } from '$lib/domain/routes';
import { claimRoute, releaseRoute } from '$lib/server/repo/openings';
import { getWall } from '$lib/server/repo/walls';
import type { Actions, PageServerLoad } from './$types';

const MAX_NAME_LENGTH = 40;

export const load: PageServerLoad = async ({ locals }) => {
	const lines = await getWall(locals.db, locals.club!);
	return { planned: plannedRoutes(lines) };
};

export const actions: Actions = {
	take: async ({ locals, params, request }) => {
		const form = await request.formData();
		const routeId = String(form.get('route') ?? '');
		const name = String(form.get('name') ?? '')
			.trim()
			.slice(0, MAX_NAME_LENGTH);

		if (!name) {
			return fail(400, { message: 'Il manque ton prénom.' });
		}

		const taken = await claimRoute(locals.db, locals.club!, routeId, name);
		if (!taken) {
			return fail(409, { message: "Quelqu'un vient de prendre cette voie." });
		}

		redirect(303, `/${params.club}/ouvertures`);
	},

	release: async ({ locals, params, request }) => {
		const form = await request.formData();
		await releaseRoute(locals.db, locals.club!, String(form.get('route') ?? ''));
		redirect(303, `/${params.club}/ouvertures`);
	}
};
