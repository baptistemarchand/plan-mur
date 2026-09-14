import type {Generated, Insertable, Selectable} from 'kysely'
import type {Color} from '$lib/domain/colors'

// Écrit à la main et tenu synchrone avec migrations/*.sql, qui font foi.
export type Database = {
  club: ClubTable
  route: RouteTable
}

type ClubTable = {
  id: Generated<number>
  slug: string
  name: string
  maxLines: Generated<number>
  passwordHash: string
  createdAt: string
  deletedAt: string | null
}

type RouteTable = {
  id: string
  clubId: number
  lineIndex: number
  position: number
  color: Color
  grade: string
  setAt: string | null
  author: string | null
  // SQLite n'a pas de booléen : 0 ou 1.
  toRemove: Generated<number>
  toOpen: Generated<number>
  deletedAt: string | null
  updatedAt: string
}

export type ClubRow = Selectable<ClubTable>

export type RouteRow = Selectable<RouteTable>
export type NewRouteRow = Insertable<RouteTable>
