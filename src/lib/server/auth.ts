// Hachage et signature, rien d'autre : aucun import de valeur, donc ce module
// s'exécute tel quel sous `node scripts/…` comme sous workerd. Le cookie et la
// base sont l'affaire de session.ts.

export const SESSION_MAX_AGE = 30 * 24 * 60 * 60

// workerd rejette au-delà de 100 000, et 100 000 coûtent ~7 ms de CPU mesurés
// sous cf:dev, pour 10 ms par requête sur le plan gratuit. On prend la marge :
// le login échouerait toujours, pas de temps en temps.
const ITERATIONS = 50_000
const SALT_BYTES = 16
const KEY_BITS = 256

const encoder = new TextEncoder()

// crypto.subtle n'accepte pas un tampon partageable : le préciser ici évite de
// le répéter à chaque signature.
type Bytes = Uint8Array<ArrayBuffer>

// Base64 sans + ni /, qui traversent mal une URL comme une valeur de cookie.
const toBase64 = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')

const fromBase64 = (text: string): Bytes =>
  Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), character => character.charCodeAt(0))

// Comparaison en temps constant : une sortie anticipée dirait combien d'octets
// sont bons, et rendrait une empreinte devinable octet par octet.
const timingSafeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) {
    return false
  }

  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i]
  }
  return diff === 0
}

const deriveBits = async (password: string, salt: Bytes, iterations: number): Promise<Uint8Array> => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt, iterations}, key, KEY_BITS)
  return new Uint8Array(bits)
}

/**
 * Rend `pbkdf2$<itérations>$<sel>$<empreinte>`. Le nombre d'itérations est dans
 * la chaîne : le baisser plus tard ne périme pas les mots de passe déjà posés.
 *
 * Le sel ne se fournit que depuis le seed, qui doit rester déterministe.
 */
export const hashPassword = async (password: string, salt?: Bytes): Promise<string> => {
  const used = salt ?? crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const bits = await deriveBits(password, used, ITERATIONS)
  return `pbkdf2$${ITERATIONS}$${toBase64(used)}$${toBase64(bits)}`
}

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [scheme, iterations, salt, hash] = stored.split('$')

  // Les clubs importés portent '!' : rien ne parse, donc rien ne correspond.
  if (scheme !== 'pbkdf2' || !Number(iterations) || !salt || !hash) {
    return false
  }

  const derived = await deriveBits(password, fromBase64(salt), Number(iterations))
  return timingSafeEqual(derived, fromBase64(hash))
}

// La clé de signature est l'empreinte du mot de passe du club : la changer coupe
// toutes ses sessions, et aucun secret n'est à provisionner à côté.
const sign = async (passwordHash: string, message: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passwordHash),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return toBase64(new Uint8Array(signature))
}

export const signSession = async (passwordHash: string, slug: string, expiresAt: number): Promise<string> =>
  `${expiresAt}.${await sign(passwordHash, `${slug}.${expiresAt}`)}`

export const verifySession = async (value: string, passwordHash: string, slug: string): Promise<boolean> => {
  const [expiresAt, signature] = value.split('.')
  const deadline = Number(expiresAt)

  if (!deadline || !signature || deadline * 1000 < Date.now()) {
    return false
  }

  const expected = await sign(passwordHash, `${slug}.${deadline}`)
  return timingSafeEqual(encoder.encode(signature), encoder.encode(expected))
}
