import { colors, type Color } from './colors';
import { isLive } from './routes';
import type { Route } from './types';

/** Une ligne accueille 5 voies, comme dans l'éditeur. */
export const MAX_ROUTES_PER_LINE = 5;

export type Suggestion = { color: Color; lines: number[] };

/**
 * Lignes où chaque couleur peut être ouverte. Deux contraintes : pas de même
 * couleur sur deux lignes adjacentes, et une ligne pas déjà pleine. Les voies
 * marquées à démonter sont supposées déjà démontées.
 */
export const getSuggestions = (lines: Route[][]): Suggestion[] => {
	const isAvailable = (color: Color, lineIndex: number): boolean => {
		if (lineIndex < 0 || lineIndex >= lines.length) {
			return true;
		}
		return lines[lineIndex].every(
			(route) => route.color !== color || route.toRemove || !isLive(route)
		);
	};

	const canSet = (color: Color, lineIndex: number) => {
		// Une voie supprimée ou à démonter n'occupe plus la ligne.
		const occupied = lines[lineIndex].filter((route) => !route.toRemove && isLive(route));
		if (occupied.length >= MAX_ROUTES_PER_LINE) {
			return false;
		}
		return (
			isAvailable(color, lineIndex) &&
			isAvailable(color, lineIndex - 1) &&
			isAvailable(color, lineIndex + 1)
		);
	};

	return colors
		.map((color) => ({
			color,
			lines: lines.flatMap((_, i) => (canSet(color, i) ? [i + 1] : []))
		}))
		.filter((suggestion) => suggestion.lines.length > 0);
};
