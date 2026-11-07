// Inline editor under a called-up player: shirt number and the positions they can cover in this match.
// Several positions can be on at once; the Rotación tab then offers the player in any of those zones,
// set by set.
import { rosterPositions } from '@/shared/domain/callups'
import { POSITION_SHORT_LABELS, POSITIONS, POSITION_LABELS } from '@/shared/domain/labels'
import type { Callup, Player, Position } from '@/shared/domain/types'

interface CallupDetailsEditorProps {
  player: Player
  callup: Callup
  /** Receives only the field that changed. */
  onChange: (changes: Partial<Pick<Callup, 'number' | 'positions'>>) => void
}

export function CallupDetailsEditor({ player, callup, onChange }: CallupDetailsEditorProps) {
  const roster = rosterPositions(player)
  const active = callup.positions ?? roster

  /** Empty input = use the roster number again. */
  function changeNumber(value: string) {
    const number = value === '' ? null : Number(value)
    if (number === callup.number || (number !== null && (number < 0 || number > 99))) return
    onChange({ number })
  }

  /** Keeps at least one position. Back to exactly the roster ones = no override. */
  function togglePosition(position: Position) {
    const next = active.includes(position)
      ? active.filter((p) => p !== position)
      : POSITIONS.filter((p) => p === position || active.includes(p))
    if (next.length === 0) return
    const sameAsRoster = next.length === roster.length && next.every((p) => roster.includes(p))
    // The roster main position stays first, so it remains the one shown on badges.
    const ordered = [...next].sort(
      (a, b) => Number(b === player.mainPosition) - Number(a === player.mainPosition),
    )
    onChange({ positions: sameAsRoster ? null : ordered })
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
          className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
        />
      </label>
      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-label={`Posiciones de ${player.firstName} en este partido`}
      >
        {POSITIONS.map((position) => {
          const on = active.includes(position)
          return (
            <button
              key={position}
              type="button"
              aria-pressed={on}
              title={POSITION_LABELS[position]}
              onClick={() => togglePosition(position)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                on
                  ? 'bg-blue-800 text-white ring-blue-800'
                  : 'bg-white text-slate-500 ring-slate-300'
              }`}
            >
              {POSITION_SHORT_LABELS[position]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
