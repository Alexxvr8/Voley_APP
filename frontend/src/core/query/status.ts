// What a screen should show while its queries are not ready, taking the device cache into account:
// data saved on the device is shown even if refreshing it failed (bad signal in the gym).

/** The parts of a TanStack Query result this needs. */
interface QueryLike {
  data: unknown
  isError: boolean
  fetchStatus: 'fetching' | 'paused' | 'idle'
}

/**
 * `null` when every query has data to show; otherwise why not: `offline` (no network and nothing
 * saved on the device), `loading` or `error`.
 */
export function queriesProblem(...queries: QueryLike[]): 'offline' | 'loading' | 'error' | null {
  const missing = queries.filter((query) => query.data === undefined)
  if (missing.length === 0) return null
  if (missing.some((query) => query.fetchStatus === 'paused')) return 'offline'
  if (missing.some((query) => query.isError)) return 'error'
  return 'loading'
}
