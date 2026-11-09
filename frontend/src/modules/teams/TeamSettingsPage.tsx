// "Ajustes" screen for the coach: pending requests, join codes, players without account (and merging
// repeated entries), season (start a new one, leavers), team details and default system, colour,
// sections, training schedule, venues, opponents, members (remove, hand over) and deleting the team.
import { useCurrentTeam } from '@/core/teams/currentTeam'
import { PageMessage } from '@/shared/ui/PageMessage'
import { useMembers, useTeamPlayers } from './api'
import { DeleteTeamCard } from './components/DeleteTeamCard'
import { FormerPlayersCard } from './components/FormerPlayersCard'
import { JoinCodesCard } from './components/JoinCodesCard'
import { ManualPlayerCard } from './components/ManualPlayerCard'
import { MergePlayersCard } from './components/MergePlayersCard'
import { MembersCard } from './components/MembersCard'
import { ModulesCard } from './components/ModulesCard'
import { OpponentsCard } from './components/OpponentsCard'
import { PendingRequestsCard } from './components/PendingRequestsCard'
import { SeasonCard } from './components/SeasonCard'
import { TeamColorCard } from './components/TeamColorCard'
import { TeamDetailsCard } from './components/TeamDetailsCard'
import { TrainingScheduleCard } from './components/TrainingScheduleCard'
import { VenuesCard } from './components/VenuesCard'
import { activeMembers, linkedPlayerIds, pendingMembers } from './members'

export function TeamSettingsPage() {
  const { team } = useCurrentTeam()
  const members = useMembers(team.id)
  const players = useTeamPlayers(team.id)

  if (members.isPending || players.isPending) return <PageMessage>Cargando…</PageMessage>
  if (members.isError || players.isError)
    return <PageMessage>No se ha podido cargar. ¿Hay conexión?</PageMessage>

  const linked = linkedPlayerIds(members.data)
  const freePlayers = players.data.filter((player) => !linked.has(player.id))

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Ajustes del equipo</h1>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <PendingRequestsCard
            teamId={team.id}
            pending={pendingMembers(members.data)}
            freePlayers={freePlayers}
          />
          <JoinCodesCard teamId={team.id} />
          <ManualPlayerCard teamId={team.id} />
          <MergePlayersCard teamId={team.id} players={players.data} linked={linked} />
          <SeasonCard team={team} activePlayers={players.data.filter((player) => player.active)} />
          <FormerPlayersCard
            teamId={team.id}
            former={players.data.filter((player) => !player.active)}
          />
          <TeamDetailsCard team={team} />
          <TeamColorCard team={team} />
          <ModulesCard team={team} />
        </div>
        <div className="space-y-4">
          <TrainingScheduleCard teamId={team.id} />
          <VenuesCard teamId={team.id} />
          <OpponentsCard teamId={team.id} />
          <MembersCard teamId={team.id} members={activeMembers(members.data)} />
          <DeleteTeamCard team={team} />
        </div>
      </div>
    </section>
  )
}
