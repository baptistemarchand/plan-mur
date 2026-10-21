import type {Route} from './types'

export const isLive = (route: Route): boolean => !route.deletedAt

const collator = new Intl.Collator('fr', {numeric: true})

export const distinctValues = (lines: Route[][], read: (route: Route) => string | null): string[] => {
  const values = lines
    .flat()
    .map(read)
    .filter((value): value is string => !!value)
  return [...new Set(values)].sort(collator.compare)
}

export const capitalize = (name: string): string => {
  const trimmed = name.trim().replace(/\s+/g, ' ')
  return trimmed.charAt(0).toLocaleUpperCase('fr') + trimmed.slice(1)
}

const sameIgnoringCase = new Intl.Collator('fr', {sensitivity: 'accent'})

/** Un nom saisi reprend l'orthographe d'un nom déjà connu à la casse près : "PAUL" devient "Paul". */
export const canonicalName = (name: string, known: string[]): string => {
  const formatted = capitalize(name)
  return known.find(other => sameIgnoringCase.compare(other, formatted) === 0) ?? formatted
}

export type RouteWithLineIndex = Route & {lineIndex: number}

export const withLineIndex = (lines: Route[][]): RouteWithLineIndex[] =>
  lines.flatMap((routes, lineIndex) => routes.map(route => ({...route, lineIndex})))

export const openedLines = (lines: Route[][]): Route[][] => lines.map(line => line.filter(route => !route.toOpen))

export const plannedRoutes = (lines: Route[][]): RouteWithLineIndex[] =>
  withLineIndex(lines).filter(route => route.toOpen && isLive(route))
