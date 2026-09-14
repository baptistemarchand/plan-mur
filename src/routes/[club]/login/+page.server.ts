import {fail, redirect} from '@sveltejs/kit'
import {verifyPassword} from '$lib/server/auth'
import {endSession, isAuthenticated, startSession} from '$lib/server/session'
import {getPasswordHash} from '$lib/server/repo/clubs'
import type {Actions, PageServerLoad} from './$types'

// Sans ce filtre, ?next= ferait de la page une redirection ouverte : on
// n'accepte qu'un chemin de ce club-ci.
const safeNext = (next: string | null, slug: string): string => (next?.startsWith(`/${slug}/`) ? next : `/${slug}/edit`)

export const load: PageServerLoad = async event => ({
  // La garde n'envoie ici que les visiteurs non connectés : arriver connecté,
  // c'est être venu à la main, et la page montre alors de quoi repartir.
  authenticated: await isAuthenticated(event),
  next: safeNext(event.url.searchParams.get('next'), event.params.club),
})

export const actions: Actions = {
  login: async ({cookies, locals, params, request}) => {
    const form = await request.formData()
    const password = String(form.get('password') ?? '')
    const next = safeNext(String(form.get('next') ?? ''), params.club)

    if (!password) {
      return fail(400, {message: 'Il manque le mot de passe.'})
    }

    // Même réponse pour un mot de passe faux et pour un club sans mot de passe
    // défini : rien n'indique lequel des deux on vient de rencontrer.
    const passwordHash = await getPasswordHash(locals.db, locals.club!)
    if (!passwordHash || !(await verifyPassword(password, passwordHash))) {
      return fail(401, {message: 'Mot de passe incorrect.'})
    }

    await startSession(cookies, locals.club!, passwordHash)
    redirect(303, next)
  },

  logout: async ({cookies, locals, params}) => {
    endSession(cookies, locals.club!)
    redirect(303, `/${params.club}/view`)
  },
}
