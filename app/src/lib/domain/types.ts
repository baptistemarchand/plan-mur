import type { Color } from './colors';

export type Route = {
	id: string;
	color: Color;
	grade: string;
	setAt?: string;
	author?: string;
	toRemove?: boolean;
	deleted?: boolean;
	toOpen?: boolean;
};

export type Club = {
	id: number;
	slug: string;
	name: string;
	/** Lignes du mur, vides comprises. */
	lineCount: number;
	/** Plafond de lignes que l'éditeur autorise. */
	maxLines: number;
};

/** Le mur d'un club : une ligne par colonne physique, dans l'ordre d'affichage. */
export type Wall = {
	lines: Route[][];
	revision: number;
};
