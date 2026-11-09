// Team roster: the team itself, players who come on some weekdays and players who come one day,
// each block by shirt number. Staff add entries here (or in Ajustes), edit them and mark who
// competes or only trains; players see it read-only. Leavers of past seasons are not shown.
import { useState } from 'react'
import { hasRole, useCurrentTeam } from '@/core/teams/currentTeam'
import { SYSTEM_LABELS } from '@/shared/domain/labels'
import type { Membership, Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { PRIMARY_BUTTON_CLASS } from '@/shared/ui/form'
import { PageMessage } from '@/shared/ui/PageMessage'
import { QueryProblemMessage } from '@/shared/ui/QueryProblemMessage'
import { queriesProblem } from '@/core/query/status'
import { PlayerForm } from '@/shared/ui/PlayerForm'
import { byShirtNumber } from '@/shared/utils/format'
import { useAddPlayer, usePlayers } from './api'
import { PlayerRow } from './components/PlayerRow'

const GROUPS: { membership: Membership; title: string }[] = [
  { membership: 'member', title: 'Equipo' },
  { membership: 'regular', title: 'Vienen algunos días' },
  { membership: 'one_off', title: 'Días sueltos' },
]

export function RosterPage() {
  const { team, role } = useCurrentTeam()
  const isStaff = hasRole(role, 'assistant')
  const players = usePlayers(team.id)
  const addPlayer = useAddPlayer(team.id)
  const [adding, setAdding] = useState(false)

  const problem = queriesProblem(players)
  if (problem || !players.data) return <QueryProblemMessage problem={problem ?? 'loading'} />

  // Players who left in a past season ("bajas") are only kept for their history.
  const active = players.data.filter((player) => player.active)
  const members = active.filter((player) => player.membership === 'member')
  const competing = members.filter((player) => player.competes).length
  const inGroup = (membership: Membership): Player[] =>
    active.filter((player) => player.membership === membership).sort(byShirtNumber)

  return (
    <section className="space-y-3 lg:max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Plantilla</h1>
          <p className="text-sm text-slate-500">
            {members.length} en el equipo · {competing} compiten · sistema{' '}
            {SYSTEM_LABELS[team.defaultSystem]}
          </p>
        </div>
        {isStaff && !adding && (
          <button type="button" onClick={() => setAdding(true)} className={PRIMARY_BUTTON_CLASS}>
            + Añadir
          </button>
        )}
      </div>

      {adding && (
        <PlayerForm
          title="Nueva ficha"
          submitLabel="Añadir"
          busy={addPlayer.isPending}
          failed={addPlayer.isError}
          onSubmit={(player) => addPlayer.mutate(player, { onSuccess: () => setAdding(false) })}
          onCancel={() => setAdding(false)}
        />
      )}

      {active.length === 0 && (
        <PageMessage>
          {isStaff
            ? 'Aún no hay jugadores. Acepta a los que entren con el código o añádelos con "+ Añadir".'
            : 'Aún no hay jugadores.'}
        </PageMessage>
      )}

      {GROUPS.map(({ membership, title }) => {
        const group = inGroup(membership)
        if (group.length === 0) return null
        return (
          <div key={membership} className="space-y-1.5">
            {/* The team block needs no title when nobody else comes. */}
            {(membership !== 'member' || group.length < active.length) && (
              <p className="px-1 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {title} · {group.length}
              </p>
            )}
            <Card className="divide-y divide-slate-100 overflow-hidden p-0">
              {group.map((player) => (
                <PlayerRow key={player.id} teamId={team.id} player={player} editable={isStaff} />
              ))}
            </Card>
          </div>
        )
      })}
    </section>
  )
}
