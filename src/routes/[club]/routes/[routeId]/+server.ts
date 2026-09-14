import {error} from '@sveltejs/kit'
import {colors, type Color} from '$lib/domain/colors'
import {saveRoute, type PositionedRoute} from '$lib/server/repo/walls'
import type {RequestHandler} from './$types'

// Rien n'authentifie encore cet appel : la validation de forme est le seul
// rempart, et elle rejette plutôt qu'elle ne rafistole.
const parseRoute = (value: unknown, id: string): PositionedRoute => {
  const route = value as Partial<PositionedRoute>

  if (typeof route.color !== 'string' || !colors.includes(route.color as Color)) {
    error(400, `Couleur inconnue : ${route.color}`)
  }
  if (typeof route.grade !== 'string') {
    error(400, 'Voie sans cotation.')
  }
  if (!Number.isInteger(route.lineIndex) || !Number.isInteger(route.position)) {
    error(400, 'Place au mur manquante.')
  }

  return {
    id,
    color: route.color as Color,
    grade: route.grade,
    setAt: route.setAt || null,
    author: route.author || null,
    toRemove: !!route.toRemove,
    toOpen: !!route.toOpen,
    deletedAt: route.deletedAt || null,
    lineIndex: route.lineIndex as number,
    position: route.position as number,
  }
}

export const PUT: RequestHandler = async ({locals, params, request}) => {
  // Les types Workers rendent json() en `{}` : on nomme la forme attendue
  // avant de la valider, la validation restant à l'exécution.
  const body = (await request.json()) as unknown

  const written = await saveRoute(locals.db, locals.club!, parseRoute(body, params.routeId))
  if (!written) {
    error(404, 'Voie inconnue pour ce club.')
  }

  return new Response(null, {status: 204})
}
