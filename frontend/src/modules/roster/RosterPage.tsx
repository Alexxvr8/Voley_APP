// Team roster sorted by shirt number. Staff add players and mark who competes or only trains;
// players see it read-only.
import { useState } from 'react'
import { hasRole, useCurrentTeam } from '@/core/teams/currentTeam'
import { SYSTEM_LABELS } from '@/shared/domain/labels'
import { Card } from '@/shared/ui/Card'
import { PRIMARY_BUTTON_CLASS } from '@/shared/ui/form'
import { PageMessage } from '@/shared/ui/PageMessage'
import { byShirtNumber } from '@/shared/utils/format'
import { usePlayers } from './api'
import { AddPlayerForm } from './components/AddPlayerForm'
import { PlayerRow } from './components/PlayerRow'

export function RosterPage() {
  const { team, role } = useCurrentTeam()
  const isStaff = hasRole(role, 'assistant')
  const players = usePlayers(team.id)
  const [adding, setAdding] = useState(false)

  if (players.isPending) return <PageMessage>Cargando…</PageMessage>
  if (players.isError)
    return <PageMessage>No se ha podido cargar la plantilla. ¿Hay conexión?</PageMessage>

  const sorted = [...players.data].sort(byShirtNumber)
  const competing = sorted.filter((player) => player.competes).length

  return (
    <section className="space-y-3 lg:max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Plantilla</h1>
          <p className="text-sm text-slate-500">
            {sorted.length} en total · {competing} compiten · sistema{' '}
            {SYSTEM_LABELS[team.defaultSystem]}
          </p>
        </div>
        {isStaff && !adding && (
          <button type="button" onClick={() => setAdding(true)} className={PRIMARY_BUTTON_CLASS}>
            + Jugador
          </button>
        )}
      </div>

      {adding && <AddPlayerForm teamId={team.id} onDone={() => setAdding(false)} />}

      {sorted.length === 0 ? (
        <PageMessage>
          Aún no hay jugadores. Añádelos o acepta a los que entren con el código.
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
