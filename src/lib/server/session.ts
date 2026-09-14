import type {Cookies, RequestEvent} from '@sveltejs/kit'
import type {Club} from '$lib/domain/types'
import {SESSION_MAX_AGE, signSession, verifySession} from './auth'
import {getPasswordHash} from './repo/clubs'

const SESSION_COOKIE = 'session'

const cookiePath = (club: Club): string => `/${club.slug}`

export const startSession = async (cookies: Cookies, club: Club, passwordHash: string): Promise<void> => {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  cookies.set(SESSION_COOKIE, await signSession(passwordHash, club.slug, expiresAt), {
    path: cookiePath(club),
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
  })
}

export const endSession = (cookies: Cookies, club: Club): void =>
  cookies.delete(SESSION_COOKIE, {path: cookiePath(club)})

export const isAuthenticated = async ({cookies, locals}: RequestEvent): Promise<boolean> => {
  const value = cookies.get(SESSION_COOKIE)
  if (!value || !locals.club) {
    return false
  }

  const passwordHash = await getPasswordHash(locals.db, locals.club)
  if (!passwordHash) {
    return false
  }

  return verifySession(value, passwordHash, locals.club.slug)
}
