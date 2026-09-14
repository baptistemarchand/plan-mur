import type { Generated, Insertable, Selectable, Updateable } from 'kysely';
import type { Color } from '$lib/domain/colors';

/**
 * Date de suppression des voies reprises de Deno KV, qui ne gardait que le
 * booléen. L'époque Unix se lit comme « supprimée, date inconnue » sans
 * inventer une date plausible.
 */
export const UNKNOWN_DELETION_DATE = '1970-01-01T00:00:00.000Z';

// Écrit à la main et tenu synchrone avec migrations/*.sql, qui font foi.
export type Database = {
	club: ClubTable;
	route: RouteTable;
};

type ClubTable = {
	id: Generated<number>;
	slug: string;
	name: string;
	lineCount: Generated<number>;
	maxLines: Generated<number>;
	passwordHash: string;
	revision: Generated<number>;
	createdAt: string;
	deletedAt: string | null;
};

type RouteTable = {
	id: string;
	clubId: number;
	lineIndex: number;
	position: number;
	color: Color;
	grade: string;
	setAt: string | null;
	author: string | null;
	// SQLite n'a pas de booléen : 0 ou 1.
	toRemove: Generated<number>;
	toOpen: Generated<number>;
	deletedAt: string | null;
	updatedAt: string;
};

export type ClubRow = Selectable<ClubTable>;
export type NewClubRow = Insertable<ClubTable>;
export type ClubUpdate = Updateable<ClubTable>;

export type RouteRow = Selectable<RouteTable>;
export type NewRouteRow = Insertable<RouteTable>;
export type RouteUpdate = Updateable<RouteTable>;
