import type { Route } from './types';

/**
 * Une voie peut être ouverte à plusieurs. La saisie est libre et les deux
 * séparateurs se sont installés à l'usage, "&" l'emportant sur "+".
 */
export const getAuthors = (route: Route): string[] => {
	if (!route.author) {
		return [];
	}
	if (route.author.includes('&')) {
		return route.author.split('&');
	}
	if (route.author.includes('+')) {
		return route.author.split('+');
	}
	return [route.author];
};

export type RouteWithLineIndex = Route & { lineIndex: number };

export const withLineIndex = (lines: Route[][]): RouteWithLineIndex[] =>
	lines.flatMap((routes, lineIndex) => routes.map((route) => ({ ...route, lineIndex })));

/**
 * Les lignes débarrassées des voies seulement planifiées, qui ne sont pas
 * encore posées au mur.
 *
 * Les voies supprimées restent : les statistiques par session et par
 * ouvreur.euse affichent l'historique, barré. Chaque appelant applique donc sa
 * propre politique de suppression, il n'y en a pas une seule.
 */
export const openedLines = (lines: Route[][]): Route[][] =>
	lines.map((line) => line.filter((route) => !route.toOpen));

export const plannedRoutes = (lines: Route[][]): RouteWithLineIndex[] =>
	withLineIndex(lines).filter((route) => route.toOpen && !route.deleted);
