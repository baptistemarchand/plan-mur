import type { Generated, Insertable, Selectable, Updateable } from 'kysely';
import type { Color } from '$lib/domain/colors';

// Écrit à la main et tenu synchrone avec migrations/*.sql, qui font foi.
export type Database = {
	club: ClubTable;
	route: RouteTable;
};

type ClubTable = {
	id: Generated<number>;
	slug: string;
	name: string;
	line_count: Generated<number>;
	max_lines: Generated<number>;
	password_hash: string;
	revision: Generated<number>;
	created_at: string;
};

type RouteTable = {
	id: string;
	club_id: number;
	line_index: number;
	position: number;
	color: Color;
	grade: string;
	set_at: string | null;
	author: string | null;
	to_remove: Generated<number>;
	to_open: Generated<number>;
	deleted: Generated<number>;
	deleted_at: string | null;
	updated_at: string;
};

export type ClubRow = Selectable<ClubTable>;
export type NewClubRow = Insertable<ClubTable>;
export type ClubUpdate = Updateable<ClubTable>;

export type RouteRow = Selectable<RouteTable>;
export type NewRouteRow = Insertable<RouteTable>;
export type RouteUpdate = Updateable<RouteTable>;
