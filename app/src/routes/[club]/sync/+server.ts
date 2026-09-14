import { error, json } from '@sveltejs/kit';
import { colors, type Color } from '$lib/domain/colors';
import type { Route } from '$lib/domain/types';
import { saveWall } from '$lib/server/repo/walls';
import type { RequestHandler } from './$types';

// L'ancienne version acceptait n'importe quel JSON sans contrôle : un POST
// suffisait à remplacer le mur d'un club par du vide.
const parseRoute = (value: unknown): Route => {
	const route = value as Partial<Route>;
	if (typeof route?.id !== 'string' || !route.id) {
		error(400, 'Voie sans identifiant.');
	}
	if (typeof route.color !== 'string' || !colors.includes(route.color as Color)) {
		error(400, `Couleur inconnue : ${route.color}`);
	}
	if (typeof route.grade !== 'string') {
		error(400, 'Voie sans cotation.');
	}
	return {
		id: route.id,
		color: route.color as Color,
		grade: route.grade,
		setAt: route.setAt || null,
		author: route.author || null,
		toRemove: !!route.toRemove,
		toOpen: !!route.toOpen,
		deletedAt: route.deletedAt || null
	};
};

export const POST: RequestHandler = async ({ locals, request }) => {
	// Les types Workers rendent json() en `{}` : on nomme la forme attendue
	// avant de la valider, la validation restant à l'exécution.
	const body = (await request.json()) as { lines?: unknown; revision?: unknown };

	if (!Array.isArray(body.lines) || typeof body.revision !== 'number') {
		error(400, 'Corps attendu : { lines, revision }.');
	}
	const revisionSent = body.revision;

	const lines = body.lines.map((line: unknown) => {
		if (!Array.isArray(line)) {
			error(400, 'Chaque ligne doit être un tableau de voies.');
		}
		return line.map(parseRoute);
	});

	const revision = await saveWall(locals.db, locals.atomic, locals.club!, lines, revisionSent);
	if (revision === undefined) {
		error(409, 'Le mur a été modifié ailleurs.');
	}

	return json({ revision });
};
