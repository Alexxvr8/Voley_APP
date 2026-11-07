// Staff form to schedule a match. Players never reach it (the button is hidden and the page checks the role).
import { Link, useNavigate } from 'react-router'
import { hasRole, useCurrentTeam, useTeamPath } from '@/core/teams/currentTeam'
import { Card } from '@/shared/ui/Card'
import { PageMessage } from '@/shared/ui/PageMessage'
import { todayIso } from '@/shared/utils/format'
import { useCreateMatch, type MatchInput } from './api'
import { MatchForm } from './components/MatchForm'

const EMPTY_MATCH: MatchInput = {
  opponent: '',
  date: todayIso(),
  warmupTime: '',
  matchTime: '',
  venue: '',
  mapsUrl: '',
  homeAway: 'home',
  notes: '',
}

export function NewMatchPage() {
  const { team, role } = useCurrentTeam()
  const teamPath = useTeamPath()
  const navigate = useNavigate()
  const createMatch = useCreateMatch(team.id)

  if (!hasRole(role, 'assistant'))
    return <PageMessage>No tienes acceso a esta sección.</PageMessage>

  return (
    <section className="max-w-xl space-y-4">
      <Link to={teamPath('partidos')} className="text-sm font-medium text-blue-800">
        ← Calendario
      </Link>
      <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Nuevo partido</h1>
      <Card>
        <MatchForm
          initial={EMPTY_MATCH}
          submitLabel="Crear partido"
          busy={createMatch.isPending}
          failed={createMatch.isError}
          onSubmit={(match) =>
            createMatch.mutate(match, { onSuccess: (id) => navigate(teamPath(`partidos/${id}`)) })
          }
        />
      </Card>
    </section>
  )
}
