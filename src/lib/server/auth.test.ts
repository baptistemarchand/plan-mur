import {describe, expect, it} from 'vitest'
import {hashPassword, signSession, verifyPassword, verifySession} from './auth'

// Ces tests tournent sur la WebCrypto de Node, pas sur celle de workerd. Le
// plafond d'itérations de PBKDF2 propre à workerd ne se vérifie qu'en cf:dev.

const inSeconds = (offset: number): number => Math.floor(Date.now() / 1000) + offset

describe('mot de passe', () => {
  it('accepte le mot de passe qui a produit l’empreinte', async () => {
    expect(await verifyPassword('demo', await hashPassword('demo'))).toBe(true)
  })

  it('refuse un autre mot de passe', async () => {
    expect(await verifyPassword('demoo', await hashPassword('demo'))).toBe(false)
  })

  it('refuse le « ! » des clubs importés, qui ne parse pas', async () => {
    expect(await verifyPassword('demo', '!')).toBe(false)
    expect(await verifyPassword('!', '!')).toBe(false)
  })

  it('sale chaque empreinte : deux hachages du même mot de passe diffèrent', async () => {
    expect(await hashPassword('demo')).not.toBe(await hashPassword('demo'))
  })

  it('reste vérifiable avec un sel imposé, ce dont le seed dépend', async () => {
    const salt = new TextEncoder().encode('seed-dev-demo-16')
    expect(await hashPassword('demo', salt)).toBe(await hashPassword('demo', salt))
    expect(await verifyPassword('demo', await hashPassword('demo', salt))).toBe(true)
  })
})

describe('session', () => {
  const hash = 'pbkdf2$100000$sel$empreinte'

  it('accepte sa propre signature', async () => {
    const value = await signSession(hash, 'demo', inSeconds(60))
    expect(await verifySession(value, hash, 'demo')).toBe(true)
  })

  it('refuse une session expirée', async () => {
    const value = await signSession(hash, 'demo', inSeconds(-1))
    expect(await verifySession(value, hash, 'demo')).toBe(false)
  })

  it('refuse la session d’un autre club', async () => {
    const value = await signSession(hash, 'demo', inSeconds(60))
    expect(await verifySession(value, hash, 'autre')).toBe(false)
  })

  it('refuse une session signée avec l’ancien mot de passe du club', async () => {
    const value = await signSession(hash, 'demo', inSeconds(60))
    expect(await verifySession(value, 'pbkdf2$100000$sel$autre', 'demo')).toBe(false)
  })

  it('refuse une échéance repoussée à la main', async () => {
    const [, signature] = (await signSession(hash, 'demo', inSeconds(60))).split('.')
    expect(await verifySession(`${inSeconds(3600)}.${signature}`, hash, 'demo')).toBe(false)
  })

  it('refuse une valeur qui n’a pas la forme attendue', async () => {
    expect(await verifySession('', hash, 'demo')).toBe(false)
    expect(await verifySession('nimporte-quoi', hash, 'demo')).toBe(false)
  })
})
