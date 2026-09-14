// Jeu de données de développement : un club et son mur, générés de toutes
// pièces. Le dump Deno KV, lui, n'est pas versionné et porte les prénoms des
// ouvreurs : sans lui une base fraîche est vide, et rien ne s'affiche.
// Les proportions (couleurs, cotations, sessions, co-ouvertures) reprennent
// celles de la prod ; les prénoms sont inventés.
//
// Comme import-kv.ts, on écrit un .sql plutôt que d'attaquer la base : il se
// relit avant exécution, et wrangler reste seul à écrire.
import {mkdirSync, writeFileSync} from 'node:fs'
import {dirname} from 'node:path'
import {colors, type Color} from '../src/lib/domain/colors.ts'
import {hashPassword} from '../src/lib/server/auth.ts'

const CLUB = {id: 1, slug: 'demo', name: 'Mur de démonstration', maxLines: 16}

/** Mot de passe du club de démonstration, annoncé tel quel dans le README. */
const PASSWORD = 'demo'

/** Sel figé : un sel tiré au hasard ferait différer deux générations. */
const PASSWORD_SALT = new TextEncoder().encode('seed-dev-demo-16')
const LINES = 16

/** L'éditeur plafonne une ligne à 5 voies posées (MAX_ROUTES_PER_LINE). */
const MAX_LIVE_PER_LINE = 5

/** Date de référence du jeu : figée, pour que deux générations soient identiques. */
const NOW = '2026-02-14T09:00:00.000Z'

type Weighted<T> = [T, number][]

// Relevés sur la prod, arrondis. Le vert est rare, le beige aussi.
const COLORS: Weighted<Color> = [
  ['rouge', 17],
  ['noir', 17],
  ['orange', 14],
  ['jaune', 14],
  ['blanc', 12],
  ['violet', 11],
  ['rose', 11],
  ['bleu', 11],
  ['vert-2', 9],
  ['gris', 6],
  ['beige', 4],
  ['vert', 2],
]

const GRADES: Weighted<string> = [
  ['4a', 7],
  ['4b', 5],
  ['4c', 4],
  ['5a', 8],
  ['5a+', 3],
  ['5b', 15],
  ['5b+', 5],
  ['5c', 23],
  ['5c+', 12],
  ['6a', 19],
  ['6a+', 9],
  ['6b', 22],
  ['6b+', 8],
  ['6c', 11],
  ['6c+', 5],
  ['7a', 10],
  ['7a+', 5],
  ['7b', 4],
  ['7c+', 3],
]

// La saisie est libre : la prod mélange deux formats et un tiers des voies
// n'a pas de session. Le jeu garde ce désordre, que l'affichage doit tenir.
const SESSIONS: Weighted<string | null> = [
  [null, 30],
  ['2023 oct', 8],
  ['2024 fev', 12],
  ['2024 oct', 10],
  ['2025 fev', 12],
  ['2025 oct', 16],
  ['fév 2026', 8],
]

const NAMES = [
  'Camille',
  'Noé',
  'Sacha',
  'Lou',
  'Ilan',
  'Maëlle',
  'Théo',
  'Anouk',
  'Basile',
  'Jade',
  'Yann',
  'Origan',
  'Nina',
  'Elio',
]

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/**
 * Générateur déterministe (mulberry32) : rejouer le script produit les mêmes
 * identifiants, donc réappliquer le seed ne crée pas de doublons.
 */
const makeRandom = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const random = makeRandom(20260214)

const pick = <T>(weighted: Weighted<T>): T => {
  const total = weighted.reduce((sum, [, weight]) => sum + weight, 0)
  let target = random() * total
  for (const [value, weight] of weighted) {
    target -= weight
    if (target <= 0) {
      return value
    }
  }
  return weighted[weighted.length - 1][0]
}

const pickOne = <T>(values: readonly T[]): T => values[Math.floor(random() * values.length)]

const chance = (probability: number) => random() < probability

const makeId = () => Array.from({length: 7}, () => ALPHABET[Math.floor(random() * ALPHABET.length)]).join('')

const makeAuthor = () => {
  if (!chance(0.7)) {
    return null
  }
  const first = pickOne(NAMES)
  if (!chance(0.11)) {
    return first
  }
  // Une voie ouverte à deux : les deux séparateurs coexistent en base.
  const second = pickOne(NAMES.filter(name => name !== first))
  return `${first} ${chance(0.6) ? '&' : '+'} ${second}`
}

const quote = (value: string | null): string => (value === null ? 'NULL' : `'${value.replace(/'/g, "''")}'`)

type SeedRoute = {
  id: string
  lineIndex: number
  position: number
  color: Color
  grade: string
  setAt: string | null
  author: string | null
  toRemove: boolean
  toOpen: boolean
  deletedAt: string | null
}

const routes: SeedRoute[] = []

/** Deux lignes voisines ne portent pas la même couleur : c'est la règle du club. */
const isFree = (color: Color, lineIndex: number) =>
  routes.every(route => route.color !== color || Math.abs(route.lineIndex - lineIndex) > 1 || route.deletedAt)

const pickColor = (lineIndex: number): Color => {
  for (let attempt = 0; attempt < 30; attempt++) {
    const color = pick(COLORS)
    if (isFree(color, lineIndex)) {
      return color
    }
  }
  return colors.find(color => isFree(color, lineIndex)) ?? pick(COLORS)
}

const addRoute = (lineIndex: number, position: number, overrides: Partial<SeedRoute> = {}) => {
  const deleted = overrides.deletedAt !== undefined
  routes.push({
    id: makeId(),
    lineIndex,
    position,
    // Une voie démontée ne gêne plus ses voisines : sa couleur est libre.
    color: deleted ? pick(COLORS) : pickColor(lineIndex),
    grade: pick(GRADES),
    setAt: pick(SESSIONS),
    author: makeAuthor(),
    toRemove: false,
    toOpen: false,
    deletedAt: null,
    ...overrides,
  })
}

for (let lineIndex = 0; lineIndex < LINES; lineIndex++) {
  let position = 0

  // L'historique : des voies démontées les sessions précédentes. Elles ne
  // s'affichent que dans les découpages par session et par ouvreur.euse.
  const removed = Math.floor(random() * 3)
  for (let i = 0; i < removed; i++) {
    addRoute(lineIndex, position++, {deletedAt: '2025-10-04T17:30:00.000Z'})
  }

  const live = 3 + Math.floor(random() * (MAX_LIVE_PER_LINE - 2))
  for (let i = 0; i < live; i++) {
    addRoute(lineIndex, position++, {toRemove: chance(0.15)})
  }

  // Deux voies planifiées, pas encore au mur. L'une est déjà prise par
  // quelqu'un, l'autre non : la vue « à ouvrir » distingue les deux.
  if (lineIndex === 3 || lineIndex === 11) {
    const taken = lineIndex === 3
    addRoute(lineIndex, position++, {toOpen: true, setAt: 'fév 2026', author: taken ? pickOne(NAMES) : null})
  }
}

const statements = [
  // Rejouable : on efface le club de démonstration avant de le réécrire.
  `DELETE FROM route WHERE clubId = ${CLUB.id};`,
  `DELETE FROM club WHERE id = ${CLUB.id};`,
  `INSERT INTO club (id, slug, name, maxLines, passwordHash, createdAt, deletedAt)\n` +
    `VALUES (${CLUB.id}, ${quote(CLUB.slug)}, ${quote(CLUB.name)}, ${CLUB.maxLines}, ` +
    `${quote(await hashPassword(PASSWORD, PASSWORD_SALT))}, ${quote(NOW)}, NULL);`,
  ...routes.map(
    route =>
      `INSERT INTO route (id, clubId, lineIndex, position, color, grade, setAt, author, toRemove, toOpen, deletedAt, updatedAt)\n` +
      `VALUES (${quote(route.id)}, ${CLUB.id}, ${route.lineIndex}, ${route.position}, ${quote(route.color)}, ` +
      `${quote(route.grade)}, ${quote(route.setAt)}, ${quote(route.author)}, ${route.toRemove ? 1 : 0}, ` +
      `${route.toOpen ? 1 : 0}, ${quote(route.deletedAt)}, ${quote(NOW)});`,
  ),
]

const output = process.argv[2] ?? 'seeds/dev.sql'
const header = [
  `-- Généré par scripts/seed-dev.ts. Données inventées, aucun prénom réel.`,
  `-- Club « ${CLUB.name} » (/${CLUB.slug}), ${routes.length} voies.`,
  `-- Mot de passe d'édition : ${PASSWORD}`,
  '',
].join('\n')

mkdirSync(dirname(output), {recursive: true})
writeFileSync(output, `${header}${statements.join('\n')}\n`)

const live = routes.filter(route => !route.deletedAt && !route.toOpen)
console.log(
  `${routes.length} voies dont ${live.length} au mur, ${routes.filter(r => r.toOpen).length} à ouvrir -> ${output}`,
)
