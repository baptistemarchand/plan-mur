import type {Route} from './types'

export const isLive = (route: Route): boolean => !route.deletedAt

/**
 * Valeurs déjà saisies sur le mur, sans doublon et triées. Pour les ouvreurs,
 * une entrée = un ouvreur même en cas d' "ouvreurs composés".
 */
export const distinctValues = (lines: Route[][], read: (route: Route) => string | null): string[] => {
  const values = lines
    .flat()
    .map(read)
    .filter((value): value is string => !!value)
  return [...new Set(values)].sort()
}

export type RouteWithLineIndex = Route & {lineIndex: number}

export const withLineIndex = (lines: Route[][]): RouteWithLineIndex[] =>
  lines.flatMap((routes, lineIndex) => routes.map(route => ({...route, lineIndex})))

export const openedLines = (lines: Route[][]): Route[][] => lines.map(line => line.filter(route => !route.toOpen))

export const plannedRoutes = (lines: Route[][]): RouteWithLineIndex[] =>
  withLineIndex(lines).filter(route => route.toOpen && isLive(route))
