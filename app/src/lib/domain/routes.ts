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

/** Les voies planifiées ne sont pas encore au mur : elles ne s'affichent pas sur le plan. */
export const visibleLines = (lines: Route[][]): Route[][] =>
	lines.map((line) => line.filter((route) => !route.toOpen));

export const plannedRoutes = (lines: Route[][]): RouteWithLineIndex[] =>
	withLineIndex(lines).filter((route) => route.toOpen && !route.deleted);
