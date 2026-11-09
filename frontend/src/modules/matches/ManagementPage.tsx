// "Gestión" tab of a match (staff): who plays, from the availability answers, and their number and
// positions for this match.
import { useParams } from 'react-router'
import { hasRole, useCurrentTeam, useTeamPath } from '@/core/teams/currentTeam'
import { MatchHeader } from '@/shared/ui/MatchHeader'
import { PageMessage } from '@/shared/ui/PageMessage'
import {
  useAvailability,
  useCallups,
  useMatches,
  usePlayers,
  useSetCalledUp,
  useSetCallupDetails,
} from './api'
import { CallupList } from './components/CallupList'

export function ManagementPage() {
  const { matchId = '' } = useParams()
  const { team, role } = useCurrentTeam()
  const teamPath = useTeamPath()
  const matches = useMatches(team.id)
  const players = usePlayers(team.id)
  const availability = useAvailability(matchId)
  const callups = useCallups(matchId)
  const setCalledUp = useSetCalledUp(matchId)
  const setDetails = useSetCallupDetails(matchId)

  if (!hasRole(role, 'assistant'))
    return <PageMessage>No tienes acceso a esta sección.</PageMessage>
  if (matches.isPending || players.isPending || availability.isPending || callups.isPending) {
    return <PageMessage>Cargando…</PageMessage>
  }
  if (matches.isError || players.isError || availability.isError || callups.isError) {
    return <PageMessage>No se ha podido cargar el partido. ¿Hay conexión?</PageMessage>
  }
  const match = matches.data.find((m) => m.id === matchId)
  if (!match) return <PageMessage>Partido no encontrado.</PageMessage>

  return (
    <section className="space-y-4">
      <MatchHeader
        match={match}
        backHref={teamPath('partidos')}
        matchPath={teamPath(`partidos/${match.id}`)}
        showManagement
        showRotation={team.enabledModules.includes('lineup')}
      />
      <div className="lg:max-w-3xl">
        <CallupList
          players={players.data.filter((player) => player.competes && player.active)}
          answers={availability.data}
          callups={callups.data}
          onToggle={(id) =>
            setCalledUp.mutate({
              playerId: id,
              calledUp: !callups.data.some((callup) => callup.playerId === id),
            })
          }
          onChangeDetails={(playerId, changes) => setDetails.mutate({ playerId, changes })}
        />
      </div>
    </section>
  )
}
