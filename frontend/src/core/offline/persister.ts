// Stores the TanStack Query cache (and changes waiting for network) in the device database, so the
// app opens with the last downloaded data even without connection.
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { offlineDb } from './db'

const CACHE_KEY = 'query-client'

export const queryPersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    await offlineDb.cache.put({ key: CACHE_KEY, value: client })
  },
  restoreClient: async () =>
    (await offlineDb.cache.get(CACHE_KEY))?.value as PersistedClient | undefined,
  removeClient: async () => {
    await offlineDb.cache.delete(CACHE_KEY)
  },
}

/** Saved data older than this is thrown away instead of shown. */
export const PERSIST_MAX_AGE = 7 * 24 * 60 * 60 * 1000
