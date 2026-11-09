// Tappable list of players with a tick on the chosen ones. Used to vote and to break a tie.
import type { Player } from '@/shared/domain/types'
import { playerName, shirtNumber } from '@/shared/utils/format'

interface PlayerPickListProps {
  players: Player[]
  /** Ids currently chosen. */
  picked: string[]
  onToggle: (playerId: string) => void
  /** Optional text at the right of each player, e.g. its votes. */
  detail?: (player: Player) => string
  disabled?: boolean
}

export function PlayerPickList({
  players,
  picked,
  onToggle,
  detail,
  disabled,
}: PlayerPickListProps) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {players.map((player) => {
        const on = picked.includes(player.id)
        return (
          <li key={player.id}>
            <button
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => onToggle(player.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ring-1 disabled:opacity-60 ${
                on
                  ? 'bg-amber-50 font-semibold text-amber-900 ring-2 ring-amber-500'
                  : 'bg-white text-slate-800 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  on ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {on ? '★' : shirtNumber(player)}
              </span>
              <span className="min-w-0 flex-1 truncate">{playerName(player)}</span>
              {detail && <span className="text-sm text-slate-500">{detail(player)}</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
