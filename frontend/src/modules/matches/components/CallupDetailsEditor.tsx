// Inline editor under a called-up player: shirt number and position for this match only.
import { POSITION_LABELS, POSITIONS } from '@/shared/domain/labels'
import type { Callup, Player, Position } from '@/shared/domain/types'

interface CallupDetailsEditorProps {
  player: Player
  callup: Callup
  onChange: (callup: Callup) => void
}

const CONTROL_CLASS = 'rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm'

export function CallupDetailsEditor({ player, callup, onChange }: CallupDetailsEditorProps) {
  /** Empty input = use the roster number again. */
  function changeNumber(value: string) {
    const number = value === '' ? null : Number(value)
    if (number === callup.number || (number !== null && (number < 0 || number > 99))) return
    onChange({ ...callup, number })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pb-2 pl-8 text-xs text-slate-500">
      <span>En este partido:</span>
      <label className="flex items-center gap-1">
        Dorsal
        <input
          type="number"
          min={0}
          max={99}
          defaultValue={callup.number ?? ''}
          placeholder={player.number === null ? '–' : String(player.number)}
          onBlur={(e) => changeNumber(e.target.value)}
          aria-label={`Dorsal de ${player.firstName} en este partido`}
          className={`w-16 ${CONTROL_CLASS}`}
        />
      </label>
      <select
        value={callup.position ?? ''}
        onChange={(e) =>
          onChange({ ...callup, position: (e.target.value || null) as Position | null })
        }
        aria-label={`Posición de ${player.firstName} en este partido`}
        className={CONTROL_CLASS}
      >
        <option value="">{POSITION_LABELS[player.mainPosition]} (habitual)</option>
        {POSITIONS.filter((position) => position !== player.mainPosition).map((position) => (
          <option key={position} value={position}>
            {POSITION_LABELS[position]}
          </option>
        ))}
      </select>
    </div>
  )
}
