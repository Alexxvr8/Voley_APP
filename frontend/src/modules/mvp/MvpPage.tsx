// "MVP": open votes, ties waiting for the coach, past MVPs and the ranking of the chosen season.
import { useState } from 'react'
import { useSeasons } from '@/core/teams/api'
import { hasRole, useCurrentTeam, useTeamPath } from '@/core/teams/currentTeam'
import type { Match, Player } from '@/shared/domain/types'
import { PageMessage } from '@/shared/ui/PageMessage'
import { SeasonSelect } from '@/shared/ui/SeasonSelect'
import { playerName } from '@/shared/utils/format'
import { useMatches, useMyCallups, usePlayers, useSettleExpiredVotes } from './api'
import { MatchVotesCard } from './components/MatchVotesCard'
import { RankingCard } from './components/RankingCard'
import { closesInLabel, seasonRanking, votePhase } from './mvp'

/** "Ana López y Bea Ruiz", or "Sin MVP" when nobody won. */
function winnersLabel(match: Match, playersById: Map<string, Player>): string {
  const names = match.mvpWinners.map((id) => {
    const player = playersById.get(id)
    return player ? playerName(player) : 'Jugadora borrada'
  })
  return names.length ? `★ ${names.join(' y ')}` : 'Sin MVP'
}

export function MvpPage() {
  const { team, role, playerId } = useCurrentTeam()
  const teamPath = useTeamPath()
  const [now] = useState(() => new Date())
  const [seasonId, setSeasonId] = useState(team.currentSeasonId)
  const seasons = useSeasons(team.id)
  const matches = useMatches(team.id)
  const players = usePlayers(team.id)
  const myCallups = useMyCallups(role === 'player' ? playerId : null)
  const isCoach = hasRole(role, 'coach')

  const played = (matches.data ?? []).filter((match) => match.status === 'played')
  useSettleExpiredVotes(
    team.id,
    played.filter((match) => votePhase(match, now) === 'expired').map((match) => match.id),
  )

  if (matches.isPending || players.isPending) return <PageMessage>Cargando…</PageMessage>
  if (matches.isError || players.isError)
    return <PageMessage>No se ha podido cargar el MVP. ¿Hay conexión?</PageMessage>

  const playersById = new Map(players.data.map((player) => [player.id, player]))
  const newestFirst = [...played].sort((a, b) => b.date.localeCompare(a.date))
  const byPhase = (phase: string) => newestFirst.filter((match) => votePhase(match, now) === phase)
  const inSeason = (list: Match[]) => list.filter((match) => match.seasonId === seasonId)
  const canVote = (match: Match) => isCoach || Boolean(myCallups.data?.includes(match.id))
  const matchHref = (matchId: string) => teamPath(`mvp/${matchId}`)
  const showRanking = isCoach || team.mvpRankingVisible

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">MVP</h1>
        <SeasonSelect
          seasons={seasons.data ?? []}
          value={seasonId}
          onChange={setSeasonId}
          currentSeasonId={team.currentSeasonId}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <MatchVotesCard
            title="Votaciones abiertas"
            matches={byPhase('open')}
            detail={(match) => closesInLabel(match.mvpClosesAt!, now)}
            action={(match) => (canVote(match) ? 'Votar' : 'Ver')}
            matchHref={matchHref}
            empty="No hay ninguna votación abierta. Se abre al apuntar el resultado del partido."
          />
          <MatchVotesCard
            title="Empates por resolver"
            matches={byPhase('tie')}
            detail={() => 'Resultado pendiente'}
            action={isCoach ? () => 'Resolver' : undefined}
            matchHref={matchHref}
          />
          {isCoach && (
            <MatchVotesCard
              title="Partidos sin votación"
              matches={inSeason(byPhase('none'))}
              detail={() => 'No se ha votado'}
              action={() => 'Abrir'}
              matchHref={matchHref}
            />
          )}
          <MatchVotesCard
            title="MVP de cada partido"
            matches={inSeason(byPhase('finished'))}
            detail={(match) => winnersLabel(match, playersById)}
            matchHref={matchHref}
          />
        </div>
        {showRanking && (
          <RankingCard
            teamId={team.id}
            ranking={seasonRanking(inSeason(matches.data), players.data, isCoach)}
            visible={team.mvpRankingVisible}
            editable={isCoach}
          />
        )}
      </div>
    </section>
  )
}
