// Staff form to schedule a match. Players never reach it (the button is hidden and the page checks the role).
import { Link, useNavigate } from 'react-router'
import { hasRole, useCurrentTeam, useTeamPath } from '@/core/teams/currentTeam'
import { Card } from '@/shared/ui/Card'
import { PageMessage } from '@/shared/ui/PageMessage'
import type { SetsFormat } from '@/shared/domain/types'
import { todayIso } from '@/shared/utils/format'
import {
  useCreateMatch,
  useMatches,
  useSaveOpponent,
  useTeamOpponents,
  useTeamVenues,
  type MatchInput,
} from './api'
import { MatchForm } from './components/MatchForm'

/** A blank match for today, with the format of the team's latest match (teams rarely change it). */
function emptyMatch(latestFormat: SetsFormat | undefined): MatchInput {
  return {
    opponent: '',
    date: todayIso(),
    matchTime: '',
    warmupMinutes: null,
    venue: '',
    mapsUrl: '',
    homeAway: 'home',
    notes: '',
    setsFormat: latestFormat ?? 'best_of_5',
  }
}

export function NewMatchPage() {
  const { team, role } = useCurrentTeam()
  const teamPath = useTeamPath()
  const navigate = useNavigate()
  const createMatch = useCreateMatch(team.id)
  const matches = useMatches(team.id)
  const venues = useTeamVenues(team.id)
  const opponents = useTeamOpponents(team.id)
  const saveOpponent = useSaveOpponent(team.id)

  if (!hasRole(role, 'assistant'))
    return <PageMessage>No tienes acceso a esta sección.</PageMessage>
  if (venues.isPending || opponents.isPending || matches.isPending)
    return <PageMessage>Cargando…</PageMessage>

  return (
    <section className="max-w-xl space-y-4">
      <Link to={teamPath('partidos')} className="text-sm font-medium text-blue-800">
        ← Calendario
      </Link>
      <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Nuevo partido</h1>
      <Card>
        <MatchForm
          initial={emptyMatch(matches.data?.at(-1)?.setsFormat)}
          submitLabel="Crear partido"
          busy={createMatch.isPending}
          failed={createMatch.isError}
          venues={venues.data ?? []}
          opponents={opponents.data ?? []}
          onSubmit={(match, addOpponent) => {
            if (addOpponent) saveOpponent.mutate(match.opponent)
            createMatch.mutate(match, { onSuccess: (id) => navigate(teamPath(`partidos/${id}`)) })
          }}
        />
      </Card>
    </section>
  )
}
