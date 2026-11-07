// "Ajustes" screen for the coach: team name, join codes, pending requests, members and training schedule.
import { useCurrentTeam } from '@/core/teams/currentTeam'
import { PageMessage } from '@/shared/ui/PageMessage'
import { useMembers, useTeamPlayers } from './api'
import { JoinCodesCard } from './components/JoinCodesCard'
import { MembersCard } from './components/MembersCard'
import { PendingRequestsCard } from './components/PendingRequestsCard'
import { TeamDetailsCard } from './components/TeamDetailsCard'
import { TrainingScheduleCard } from './components/TrainingScheduleCard'
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
          <TeamDetailsCard key={team.name + team.category + team.season} team={team} />
        </div>
        <div className="space-y-4">
          <TrainingScheduleCard teamId={team.id} />
          <MembersCard teamId={team.id} members={activeMembers(members.data)} />
        </div>
      </div>
    </section>
  )
}
