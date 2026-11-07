// "Resultados": played matches with their result and the unofficial league table.
import { hasRole, useCurrentTeam, useTeamPath } from '@/core/teams/currentTeam'
import { PageMessage } from '@/shared/ui/PageMessage'
import { useLeagueTable, useMatches } from './api'
import { LeagueTableCard } from './components/LeagueTableCard'
import { PlayedMatchesCard } from './components/PlayedMatchesCard'

export function ResultsPage() {
  const { team, role } = useCurrentTeam()
  const teamPath = useTeamPath()
  const matches = useMatches(team.id)
  const table = useLeagueTable(team.id)

  if (matches.isPending || table.isPending) return <PageMessage>Cargando…</PageMessage>
  if (matches.isError || table.isError)
    return <PageMessage>No se han podido cargar los resultados. ¿Hay conexión?</PageMessage>

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Resultados</h1>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <PlayedMatchesCard matches={matches.data} matchHref={(id) => teamPath(`partidos/${id}`)} />
        <LeagueTableCard
          teamId={team.id}
          table={table.data}
          editable={hasRole(role, 'assistant')}
        />
      </div>
    </section>
  )
}
