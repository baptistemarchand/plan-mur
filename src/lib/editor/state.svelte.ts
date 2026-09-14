import {getContext, setContext} from 'svelte'
import {customAlphabet} from 'nanoid'
import {MAX_ROUTES_PER_LINE} from '$lib/domain/suggestions'
import {isLive} from '$lib/domain/routes'
import type {Club, Route} from '$lib/domain/types'

// Même alphabet et même longueur que la version Fresh : les identifiants
// existants restent valides.
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 7)

type SaveState = 'SAVED' | 'SAVING' | 'FAILED'

const firstRouteId = (line: Route[] = []): string | undefined => line.find(isLive)?.id

export class EditorState {
  lines = $state<Route[][]>([])
  selectedLine = $state(0)
  selectedRouteId = $state<string | undefined>(undefined)
  saveState = $state<SaveState>('SAVED')
  authorPopup = $state(false)
  setAtPopup = $state(false)

  readonly club: Club
  // Les écritures s'enchaînent au lieu de partir en parallèle : une rafale
  // d'appuis sur la cotation part en autant de requêtes, et rien ne garantit
  // leur ordre d'arrivée. Sans cette file, deux appuis peuvent s'inverser.
  #pending: Promise<unknown> = Promise.resolve()

  constructor(club: Club, lines: Route[][]) {
    this.club = club
    this.lines = lines
    this.selectedRouteId = firstRouteId(lines[0])
  }

  currentLine = $derived(this.lines[this.selectedLine] ?? [])
  visibleRoutes = $derived(this.currentLine.filter(isLive))
  currentRoute = $derived(this.currentLine.find(route => route.id === this.selectedRouteId))
  canAddRoute = $derived(this.visibleRoutes.length < MAX_ROUTES_PER_LINE)

  get canAddLine() {
    return this.lines.length < this.club.maxLines
  }

  /** Valeurs déjà saisies, proposées avant la saisie libre. */
  allSetAts = $derived(this.#distinct(route => route.setAt))

  // Les saisies collectives ("a & b") ne sont pas des ouvreurs proposables.
  allAuthors = $derived(
    this.#distinct(route => route.author).filter(
      author => !author.includes('+') && !author.includes('/') && !author.includes('&'),
    ),
  )

  #distinct(read: (route: Route) => string | null): string[] {
    const values = this.lines
      .flat()
      .map(read)
      .filter((value): value is string => !!value)
    return [...new Set(values)].sort()
  }

  selectLine(index: number) {
    this.selectedLine = index
    this.selectedRouteId = firstRouteId(this.lines[index])
  }

  /** Une ligne laissée vide ne survit pas au rechargement : rien à écrire. */
  addLine() {
    this.lines = [...this.lines, []]
    this.selectLine(this.lines.length - 1)
  }

  addRoute() {
    const id = nanoid()
    const lineIndex = this.selectedLine
    this.lines = this.lines.map((routes, i) =>
      i === lineIndex
        ? [
            ...routes,
            {
              id,
              grade: '4a',
              color: 'blanc' as const,
              setAt: null,
              author: null,
              toRemove: false,
              toOpen: false,
              deletedAt: null,
            },
          ]
        : routes,
    )
    this.selectedRouteId = id
    this.#save(lineIndex, this.lines[lineIndex].length - 1)
  }

  updateCurrent(update: (route: Route) => Partial<Route>) {
    const lineIndex = this.selectedLine
    const position = this.currentLine.findIndex(route => route.id === this.selectedRouteId)
    if (position < 0) {
      return
    }

    this.lines = this.lines.map((routes, i) =>
      i === lineIndex ? routes.map((route, j) => (j === position ? {...route, ...update(route)} : route)) : routes,
    )
    this.#save(lineIndex, position)
  }

  deleteCurrent() {
    this.updateCurrent(() => ({deletedAt: new Date().toISOString()}))
    this.selectedRouteId = firstRouteId(this.lines[this.selectedLine])
  }

  #save(lineIndex: number, position: number) {
    const route = this.lines[lineIndex]?.[position]
    if (!route) {
      return
    }

    this.saveState = 'SAVING'
    this.#pending = this.#pending
      .then(() =>
        fetch(`/${this.club.slug}/routes/${route.id}`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({...route, lineIndex, position}),
        }),
      )
      .then(response => {
        this.saveState = response.ok ? 'SAVED' : 'FAILED'
      })
      .catch(() => {
        this.saveState = 'FAILED'
      })
  }
}

const KEY = Symbol('editor')

export const setEditorState = (state: EditorState) => setContext(KEY, state)
export const getEditorState = (): EditorState => getContext(KEY)
