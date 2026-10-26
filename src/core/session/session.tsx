// Mock session until Supabase Auth is wired in. Lets you switch role to preview each view.
import { createContext, useContext, useState, type ReactNode } from 'react'
import type { TeamRole } from '@/core/modules/types'

const ROLE_RANK: Record<TeamRole, number> = { player: 0, assistant: 1, coach: 2 }

/** Sample player linked to the mock account when previewing the player role. */
const MOCK_PLAYER_ID = 'p2'

interface Session {
  role: TeamRole
  /** Roster entry linked to the current user, if any. */
  playerId: string | null
  setRole: (role: TeamRole) => void
}

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<TeamRole>('coach')
  const playerId = role === 'player' ? MOCK_PLAYER_ID : null
  return <SessionContext.Provider value={{ role, playerId, setRole }}>{children}</SessionContext.Provider>
}

export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside SessionProvider')
  return session
}

export function hasRole(role: TeamRole, minRole: TeamRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole]
}
