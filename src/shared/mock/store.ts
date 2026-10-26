// Minimal in-memory store for the sample data, to be replaced by Supabase + TanStack Query.
import { useSyncExternalStore } from 'react'
import type { AvailabilityEntry, AvailabilityStatus } from '@/shared/domain/types'
import { initialAvailability, initialCallups } from './data'

interface MockState {
  availability: Record<string, Record<string, AvailabilityEntry>>
  callups: Record<string, string[]>
}

let state: MockState = { availability: initialAvailability, callups: initialCallups }
const listeners = new Set<() => void>()

function setState(next: MockState) {
  state = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useMockStore(): MockState {
  return useSyncExternalStore(subscribe, () => state)
}

export function setAvailability(matchId: string, playerId: string, status: AvailabilityStatus) {
  setState({
    ...state,
    availability: {
      ...state.availability,
      [matchId]: { ...state.availability[matchId], [playerId]: { status } },
    },
  })
}

export function toggleCallup(matchId: string, playerId: string) {
  const current = state.callups[matchId] ?? []
  const next = current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId]
  setState({ ...state, callups: { ...state.callups, [matchId]: next } })
}
