// Whether the device has network, as TanStack Query sees it (it pauses requests while offline).
import { onlineManager } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

export function useOnline(): boolean {
  return useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
  )
}
