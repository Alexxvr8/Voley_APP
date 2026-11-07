// One roster row: shirt number, name, birth year and all positions. Staff also get the "compite"
// switch and "Editar", which opens the player form in place.
import { useState } from 'react'
import type { Player } from '@/shared/domain/types'
import { PositionBadge } from '@/shared/ui/PositionBadge'
import { playerName, shirtNumber } from '@/shared/utils/format'
import { useUpdatePlayer } from '../api'
import { CompetesSwitch } from './CompetesSwitch'
import { PlayerForm } from './PlayerForm'

interface PlayerRowProps {
  teamId: string
  player: Player
  /** Staff can edit the player and change who competes; everyone else only sees it. */
  editable: boolean
}

export function PlayerRow({ teamId, player, editable }: PlayerRowProps) {
  const updatePlayer = useUpdatePlayer(teamId, player.id)
  const [editing, setEditing] = useState(false)

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
      </div>
    )
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-3 px-4 py-3 ${player.competes ? '' : 'bg-slate-50'}`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-900 font-bold text-white">
        {shirtNumber(player)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{playerName(player)}</p>
        {player.birthYear && <p className="text-xs text-slate-500">{player.birthYear}</p>}
      </div>
      <div className="flex flex-wrap justify-end gap-1">
        <PositionBadge position={player.mainPosition} />
        {player.otherPositions.map((position) => (
          <span key={position} className="opacity-60">
            <PositionBadge position={position} short />
          </span>
        ))}
      </div>
      {editable ? (
        <>
          <CompetesSwitch teamId={teamId} player={player} />
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-blue-800 underline"
          >
            Editar
          </button>
        </>
      ) : (
        !player.competes && (
          <span className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Solo entrena
          </span>
        )
      )}
    </div>
  )
}
