import type {RouteWithLineIndex} from './routes'

export type Bucket<T> = {label: string; items: T[]}

type BucketOptions<T> = {
  getBuckets: (item: T) => string[]
  sortBy?: (bucket: Bucket<T>) => string | number
}

export const bucketize = <T>(items: T[], {getBuckets, sortBy}: BucketOptions<T>): Bucket<T>[] => {
  const byLabel = new Map<string, T[]>()

  for (const item of items) {
    for (const label of getBuckets(item)) {
      const existing = byLabel.get(label)
      if (existing) {
        existing.push(item)
      } else {
        byLabel.set(label, [item])
      }
    }
  }

  const buckets = [...byLabel].map(([label, items]) => ({label, items}))
  buckets.sort((a, b) => {
    const keyA = sortBy?.(a) ?? a.label
    const keyB = sortBy?.(b) ?? b.label
    return keyA > keyB ? 1 : keyB > keyA ? -1 : 0
  })
  return buckets
}

/** Les 4a/4b/4c sont comptés ensemble, et le "+" ne distingue pas un niveau. */
export const gradeBucket = (grade: string): string => (grade.includes('4') ? '4' : grade.replace('+', ''))

export const UNKNOWN_SESSION = 'Inconnue'

/** "2025 oct" se trie sur son année ; les voies sans session passent en tête. */
export const sessionSortKey = (label: string): number =>
  label === UNKNOWN_SESSION ? -Infinity : parseInt(label.replace(/[^0-9]/g, ''))

export const byLine = (bucket: Bucket<RouteWithLineIndex>): number => bucket.items[0].lineIndex

export const byCountDesc = <T>(bucket: Bucket<T>): number => -bucket.items.length
