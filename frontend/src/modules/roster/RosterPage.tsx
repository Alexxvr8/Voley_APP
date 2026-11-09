// Team roster sorted by shirt number. Staff edit players and mark who competes or only trains;
// players see it read-only. New entries come from accepting accounts or from Ajustes.
import { hasRole, useCurrentTeam } from '@/core/teams/currentTeam'
import { SYSTEM_LABELS } from '@/shared/domain/labels'
import { Card } from '@/shared/ui/Card'
import { PageMessage } from '@/shared/ui/PageMessage'
import { byShirtNumber } from '@/shared/utils/format'
import { usePlayers } from './api'
import { PlayerRow } from './components/PlayerRow'

export function RosterPage() {
  const { team, role } = useCurrentTeam()
  const isStaff = hasRole(role, 'assistant')
  const players = usePlayers(team.id)

  if (players.isPending) return <PageMessage>Cargando…</PageMessage>
  if (players.isError)
    return <PageMessage>No se ha podido cargar la plantilla. ¿Hay conexión?</PageMessage>

  // Players who left in a past season ("bajas") are only kept for their history.
  const sorted = players.data.filter((player) => player.active).sort(byShirtNumber)
  const competing = sorted.filter((player) => player.competes).length

  return (
    <section className="space-y-3 lg:max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Plantilla</h1>
        <p className="text-sm text-slate-500">
          {sorted.length} en total · {competing} compiten · sistema{' '}
          {SYSTEM_LABELS[team.defaultSystem]}
        </p>
      </div>

      {sorted.length === 0 ? (
        <PageMessage>
          {isStaff
            ? 'Aún no hay jugadores. Acepta a los que entren con el código o añádelos en Ajustes.'
            : 'Aún no hay jugadores.'}
        </PageMessage>
      ) : (
        <Card className="divide-y divide-slate-100 overflow-hidden p-0">
          {sorted.map((player) => (
            <PlayerRow key={player.id} teamId={team.id} player={player} editable={isStaff} />
          ))}
        </Card>
      )}
    </section>
  )
}
