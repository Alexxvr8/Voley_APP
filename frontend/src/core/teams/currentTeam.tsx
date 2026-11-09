// The team being viewed (from the URL) and the user's role in it. Every team screen reads it from here.
import { createContext, useContext, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import type { MyTeam, Team, TeamRole } from '@/shared/domain/types'
import { PageMessage } from '@/shared/ui/PageMessage'
import { queriesProblem } from '@/core/query/status'
import { QueryProblemMessage } from '@/shared/ui/QueryProblemMessage'
import { useMyTeams, useTeam } from './api'

const ROLE_RANK: Record<TeamRole, number> = { player: 0, assistant: 1, coach: 2 }

export function hasRole(role: TeamRole, minRole: TeamRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole]
}

interface CurrentTeam {
  team: Team
  role: TeamRole
  /** Roster entry linked to the user in this team (players), null for staff without a roster entry. */
  playerId: string | null
}

const CurrentTeamContext = createContext<CurrentTeam | null>(null)

/** Loads the team in `/equipos/:teamId`. Pending players see a waiting message instead of the team. */
export function CurrentTeamProvider({ children }: { children: ReactNode }) {
  const { teamId = '' } = useParams()
  const myTeams = useMyTeams()
  const membership: MyTeam | undefined = myTeams.data?.find((team) => team.id === teamId)
  const team = useTeam(teamId, Boolean(membership && !membership.pending))

  const teamsProblem = queriesProblem(myTeams)
  if (teamsProblem) return <QueryProblemMessage problem={teamsProblem} />
  if (!membership) {
    return (
      <PageMessage>
        No perteneces a este equipo.{' '}
        <Link to="/" className="font-medium text-blue-800 underline">
          Ver mis equipos
        </Link>
      </PageMessage>
    )
  }
  if (membership.pending) {
    return (
      <PageMessage>
        Tu solicitud para entrar en <strong>{membership.name}</strong> está pendiente. El entrenador
        tiene que aceptarte.{' '}
        <Link to="/" className="font-medium text-blue-800 underline">
          Volver
        </Link>
      </PageMessage>
    )
  }
  const teamProblem = queriesProblem(team)
  if (teamProblem || !team.data) return <QueryProblemMessage problem={teamProblem ?? 'loading'} />

  return (
    <CurrentTeamContext.Provider
      value={{ team: team.data, role: membership.role, playerId: membership.playerId }}
    >
      {children}
    </CurrentTeamContext.Provider>
  )
}

export function useCurrentTeam(): CurrentTeam {
  const current = useContext(CurrentTeamContext)
  if (!current) throw new Error('useCurrentTeam must be used inside CurrentTeamProvider')
  return current
}

/** Builds absolute links inside the current team: `teamPath('partidos')` → `/equipos/<id>/partidos`. */
export function useTeamPath(): (path: string) => string {
  const { team } = useCurrentTeam()
  return (path) => `/equipos/${team.id}/${path}`
}
