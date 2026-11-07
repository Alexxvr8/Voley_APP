// Short messages shown on top of any screen (e.g. "X había cambiado el set 2…"). Any module can
// push one with `notify`; the shell shows and dismisses them.
import { useSyncExternalStore } from 'react'

export interface Notice {
  id: number
  text: string
}

let notices: Notice[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function notify(text: string): void {
  notices = [...notices, { id: nextId++, text }]
  emit()
}

export function dismissNotice(id: number): void {
  notices = notices.filter((notice) => notice.id !== id)
  emit()
}

export function useNotices(): Notice[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => notices,
  )
}
