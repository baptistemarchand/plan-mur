import {fail, redirect} from '@sveltejs/kit'
import {verifyPassword} from '$lib/server/auth'
import {endSession, isAuthenticated, startSession} from '$lib/server/session'
import {getPasswordHash} from '$lib/server/repo/clubs'
import type {Actions, PageServerLoad} from './$types'

// Sans ce filtre, ?next= ferait de la page une redirection ouverte : on
// n'accepte qu'un chemin de ce club-ci. Le test porte sur le chemin résolu, pas
// sur la chaîne reçue : le navigateur, lui, réduit les « .. » et jette les
// retours chariot avant de suivre le Location.
const safeNext = (next: string | null, slug: string, origin: string): string => {
  const inClub = `/${slug}/`
  const path = next?.startsWith(inClub) ? new URL(next, origin).pathname : ''
  return path.startsWith(inClub) ? path : `/${slug}/edit`
}

export const load: PageServerLoad = async event => ({
  // La garde n'envoie ici que les visiteurs non connectés : arriver connecté,
  // c'est être venu à la main, et la page montre alors de quoi repartir.
  authenticated: await isAuthenticated(event),
  next: safeNext(event.url.searchParams.get('next'), event.params.club, event.url.origin),
})

export const actions: Actions = {
  login: async ({cookies, locals, params, request, url}) => {
    const form = await request.formData()
    const password = String(form.get('password') ?? '')
    const next = safeNext(String(form.get('next') ?? ''), params.club, url.origin)

    if (!password) {
      return fail(400, {message: 'Il manque le mot de passe.'})
    }

    // Même message pour un mot de passe faux et pour un club dont le mot de
    // passe n'est pas encore posé. Le temps de réponse les distingue, faute de
    // dérivation dans le second cas : sans rien de sensible derrière, on ne
    // paie pas un PBKDF2 pour le masquer.
    const passwordHash = await getPasswordHash(locals.db, locals.club!)
    if (!passwordHash || !(await verifyPassword(password, passwordHash))) {
      return fail(401, {message: 'Mot de passe incorrect.'})
    }

    await startSession(cookies, locals.club!, passwordHash)
    redirect(303, next)
  },

  logout: async ({cookies, locals, params}) => {
    endSession(cookies, locals.club!)
    redirect(303, `/${params.club}`)
  },
}
