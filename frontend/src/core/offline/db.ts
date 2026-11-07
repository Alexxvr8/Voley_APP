// The device's own database (IndexedDB through Dexie): what the app needs to keep working without
// network. Everything here belongs to the signed-in user and is wiped on sign-out.
import Dexie, { type EntityTable } from 'dexie'

/** One stored value, e.g. the saved TanStack Query cache. */
interface KeyValueRow {
  key: string
  value: unknown
}

/** A match whose data (call-ups, roster, set plans) is on the device. */
export interface OfflineMatch {
  matchId: string
  teamId: string
  /** When it was last downloaded, `Date.now()`. */
  syncedAt: number
}

/** A change made on this device that still has to reach the server (one row per thing changed). */
export interface OutboxEntry {
  /** What is changed, e.g. `set-plan:<match>:<set>`. A newer change to the same thing replaces it. */
  key: string
  /** Which handler sends it (registered with `registerOutboxHandler`). */
  kind: string
  payload: unknown
  /** `Date.now()` when queued; a row is only removed if it was not changed again while sending. */
  queuedAt: number
}

class OfflineDatabase extends Dexie {
  /** Saved query cache and paused (offline) changes. */
  cache!: EntityTable<KeyValueRow, 'key'>
  offlineMatches!: EntityTable<OfflineMatch, 'matchId'>
  /** Small per-screen state that must survive closing the app (e.g. where the match mode is). */
  localState!: EntityTable<KeyValueRow, 'key'>
  /** Changes made offline (or not sent yet), sent in order when there is network. */
  outbox!: EntityTable<OutboxEntry, 'key'>

  constructor() {
    super('voley-offline')
    this.version(1).stores({ cache: 'key', offlineMatches: 'matchId, teamId', localState: 'key' })
    this.version(2).stores({ outbox: 'key, kind, queuedAt' })
  }
}

export const offlineDb = new OfflineDatabase()

/** Removes everything stored for the current user (on sign-out). */
export async function clearOfflineData(): Promise<void> {
  await Promise.all([
    offlineDb.cache.clear(),
    offlineDb.offlineMatches.clear(),
    offlineDb.localState.clear(),
    offlineDb.outbox.clear(),
  ])
}

/** Reads a value saved with `saveLocalState`. */
export async function loadLocalState<T>(key: string): Promise<T | undefined> {
  return (await offlineDb.localState.get(key))?.value as T | undefined
}

export async function saveLocalState(key: string, value: unknown): Promise<void> {
  await offlineDb.localState.put({ key, value })
}
