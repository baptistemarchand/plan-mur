import type { Route } from './types';

/** Une voie encore au mur. La suppression est logique, jamais une ligne retirée. */
export const isLive = (route: Route): boolean => !route.deletedAt;

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

export const openedLines = (lines: Route[][]): Route[][] =>
	lines.map((line) => line.filter((route) => !route.toOpen));

export const plannedRoutes = (lines: Route[][]): RouteWithLineIndex[] =>
	withLineIndex(lines).filter((route) => route.toOpen && isLive(route));
