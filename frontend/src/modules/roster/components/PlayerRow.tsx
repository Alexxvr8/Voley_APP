// One roster row: shirt number, name, birth year (and when a guest comes) and all positions. Staff also get the "compite"
// switch and "Editar", which opens the player form in place (with "Borrar ficha").
import { useState } from 'react'
import type { Player } from '@/shared/domain/types'
import { PositionBadge } from '@/shared/ui/PositionBadge'
import { WEEKDAY_LABELS } from '@/shared/domain/labels'
import { formatShortDate, fullName, playerName, shirtNumber } from '@/shared/utils/format'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useDeletePlayer, useUpdatePlayer } from '../api'
import { CompetesSwitch } from './CompetesSwitch'
import { PlayerForm } from '@/shared/ui/PlayerForm'

/** When a guest comes: "Lu, Mi" or "sáb 14 nov"; empty for team members. */
function visitLabel(player: Player): string {
  if (player.membership === 'regular')
    return player.visitWeekdays.map((day) => WEEKDAY_LABELS[day].slice(0, 2)).join(', ')
  if (player.membership === 'one_off' && player.visitDate) return formatShortDate(player.visitDate)
  return ''
}

interface PlayerRowProps {
  teamId: string
  player: Player
  /** Staff can edit the player and change who competes; everyone else only sees it. */
  editable: boolean
}

export function PlayerRow({ teamId, player, editable }: PlayerRowProps) {
  const updatePlayer = useUpdatePlayer(teamId, player.id)
  const deletePlayer = useDeletePlayer(teamId)
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (editing) {
    return (
      <div className="bg-slate-50 p-3">
        <PlayerForm
          title={`Editar a ${playerName(player)}`}
          initial={player}
          submitLabel="Guardar"
          busy={updatePlayer.isPending}
          failed={updatePlayer.isError}
          onSubmit={(changes) =>
            updatePlayer.mutate(changes, { onSuccess: () => setEditing(false) })
          }
          onCancel={() => setEditing(false)}
        />
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="mt-2 w-full text-center text-sm font-medium text-rose-700 underline"
        >
          Borrar ficha
        </button>
        {confirmingDelete && (
          <ConfirmDialog
            title={`¿Borrar la ficha de ${playerName(player)}?`}
            confirmLabel="Borrar"
            busy={deletePlayer.isPending}
            onCancel={() => setConfirmingDelete(false)}
            onConfirm={() => deletePlayer.mutate(player.id)}
          >
            Se borran también sus respuestas, convocatorias y asistencia a entrenamientos. Si tiene
            cuenta, seguirá en el equipo pero como pendiente, hasta que la vincules a otra ficha. Si
            es una ficha repetida, mejor usa "Juntar fichas repetidas" en Ajustes para no perder
            nada.
          </ConfirmDialog>
        )}
      </div>
    )
  }

  // Two lines: who it is (number, name, positions) and, for staff, the controls under it, so the
  // name keeps its room on narrow phones.
  return (
    <div className={`space-y-2 px-4 py-3 ${player.competes ? '' : 'bg-slate-50'}`}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-900 font-bold text-white">
          {shirtNumber(player)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900">{playerName(player)}</p>
          <p className="truncate text-xs text-slate-500">
            {[player.nickname && fullName(player), player.birthYear, visitLabel(player)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        {/* Short labels (Co, Re…); the first one is the main position. */}
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          <PositionBadge position={player.mainPosition} short />
          {player.otherPositions.map((position) => (
            <span key={position} className="opacity-60">
              <PositionBadge position={position} short />
            </span>
          ))}
        </div>
        {!editable && !player.competes && (
          <span className="shrink-0 rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Solo entrena
          </span>
        )}
      </div>
      {editable && (
        <div className="flex items-center justify-end gap-4 pl-13">
          <CompetesSwitch teamId={teamId} player={player} />
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-blue-800 underline"
          >
            Editar
          </button>
        </div>
      )}
    </div>
  )
}
