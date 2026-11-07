// Outbox: changes made on this device are written here at once (so closing the app or losing the
// network never loses them) and sent to the server in order whenever there is network. A newer change
// to the same thing replaces the queued one. Modules register how to send each kind of change.
import { onlineManager } from '@tanstack/react-query'
import { useLiveQuery } from 'dexie-react-hooks'
import { offlineDb, type OutboxEntry } from './db'
import { notify } from './notices'

/** Sends one change. Throwing keeps it queued (e.g. no network); returning removes it. */
export type OutboxHandler = (payload: unknown) => Promise<void>

const handlers = new Map<string, OutboxHandler>()
let flushing = false
let flushAgain = false

export function registerOutboxHandler(kind: string, handler: OutboxHandler): void {
  handlers.set(kind, handler)
}

/** Queues a change (replacing an older one with the same key) and tries to send it. */
export async function enqueue(key: string, kind: string, payload: unknown): Promise<void> {
  await offlineDb.outbox.put({ key, kind, payload, queuedAt: Date.now() })
  void flushOutbox()
}

/** True for errors that mean "try again later" rather than "this change is wrong". */
function isNetworkError(error: unknown): boolean {
  if (!onlineManager.isOnline()) return true
  const message =
    error instanceof Error ? error.message : String((error as { message?: unknown })?.message ?? '')
  return /fetch|network|load failed/i.test(message)
}

/** Sends every queued change, oldest first. Stops at the first network failure and retries later. */
export async function flushOutbox(): Promise<void> {
  if (flushing) {
    flushAgain = true
    return
  }
  flushing = true
  try {
    do {
      flushAgain = false
      if (!onlineManager.isOnline()) return
      const entries = await offlineDb.outbox.orderBy('queuedAt').toArray()
      for (const entry of entries) {
        const handler = handlers.get(entry.kind)
        if (!handler) continue
        try {
          await handler(entry.payload)
        } catch (error) {
          if (isNetworkError(error)) return
          // A change the server refuses would block the queue forever: tell the user and drop it.
          const reason = (error as { message?: string })?.message ?? ''
          notify(`No se ha podido guardar un cambio y se ha descartado. ${reason}`.trim())
        }
        await removeIfUnchanged(entry)
      }
    } while (flushAgain)
  } finally {
    flushing = false
  }
}

/** Removes a sent entry unless a newer change to the same thing was queued meanwhile. */
async function removeIfUnchanged(sent: OutboxEntry): Promise<void> {
  await offlineDb.transaction('rw', offlineDb.outbox, async () => {
    const current = await offlineDb.outbox.get(sent.key)
    if (current && current.queuedAt === sent.queuedAt) await offlineDb.outbox.delete(sent.key)
  })
}

/** Sends the queue when the network comes back and once when the app starts. */
export function startOutbox(): void {
  onlineManager.subscribe((online) => {
    if (online) void flushOutbox()
  })
  void flushOutbox()
}

/** Number of changes waiting to be sent. */
export function usePendingChanges(): number {
  return useLiveQuery(() => offlineDb.outbox.count(), []) ?? 0
}

/** Queued entries whose key starts with a prefix (e.g. the set plans of a match); undefined while loading. */
export function useOutboxEntries(prefix: string): OutboxEntry[] | undefined {
  return useLiveQuery(() => offlineDb.outbox.where('key').startsWith(prefix).toArray(), [prefix])
}
