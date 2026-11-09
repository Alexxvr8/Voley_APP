// "Resultados": played matches with their result and the unofficial league table, per season.
import { useState } from 'react'
import { useSeasons } from '@/core/teams/api'
import { hasRole, useCurrentTeam, useTeamPath } from '@/core/teams/currentTeam'
import { PageMessage } from '@/shared/ui/PageMessage'
import { SeasonSelect } from '@/shared/ui/SeasonSelect'
import { useLeagueTable, useMatches } from './api'
import { LeagueTableCard } from './components/LeagueTableCard'
import { PlayedMatchesCard } from './components/PlayedMatchesCard'

export function ResultsPage() {
  const { team, role } = useCurrentTeam()
  const teamPath = useTeamPath()
  const [seasonId, setSeasonId] = useState(team.currentSeasonId)
  const seasons = useSeasons(team.id)
  const matches = useMatches(team.id)
  const table = useLeagueTable(seasonId)
  const isCurrent = seasonId === team.currentSeasonId

  if (matches.isPending || table.isPending) return <PageMessage>Cargando…</PageMessage>
  if (matches.isError || table.isError)
    return <PageMessage>No se han podido cargar los resultados. ¿Hay conexión?</PageMessage>

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Resultados</h1>
        <SeasonSelect
          seasons={seasons.data ?? []}
          value={seasonId}
          onChange={setSeasonId}
          currentSeasonId={team.currentSeasonId}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <PlayedMatchesCard
          matches={matches.data.filter((match) => match.seasonId === seasonId)}
          matchHref={(id) => teamPath(`partidos/${id}`)}
        />
        {/* Past seasons' tables are kept as they were. */}
        <LeagueTableCard
          key={seasonId}
          teamId={team.id}
          seasonId={seasonId}
          table={table.data}
          editable={isCurrent && hasRole(role, 'assistant')}
        />
      </div>
    </section>
  )
}
