import type {Color} from './colors'

export type Route = {
  id: string
  color: Color
  grade: string
  /** Session d'ouverture, libellé libre du club : "2025 oct". */
  setAt: string | null
  author: string | null
  toRemove: boolean
  toOpen: boolean
  deletedAt: string | null
}

export type Club = {
  id: number
  slug: string
  name: string
  maxLines: number
}
