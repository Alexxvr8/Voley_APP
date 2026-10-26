// Dropdown to pick one player, used wherever a screen asks "who?" (zones, libero, substitutions).
import type { Player } from '@/shared/domain/types'

interface PlayerSelectProps {
  /** Players offered as options, in the order given. */
  players: Player[]
  /** Selected player id, or undefined when nobody is selected. */
  value: string | undefined
  /** Called with the new player id, or undefined when the empty option is chosen. */
  onChange: (playerId: string | undefined) => void
  /** Text of the empty option. */
  placeholder?: string
  className?: string
}

const DEFAULT_CLASS = 'w-full rounded-lg border border-slate-300 bg-white px-2 py-2'

/** Shows each player as "number. first name", which is how coaches call them on court. */
export function PlayerSelect({ players, value, onChange, placeholder = '—', className = DEFAULT_CLASS }: PlayerSelectProps) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)} className={className}>
      <option value="">{placeholder}</option>
      {players.map((player) => (
        <option key={player.id} value={player.id}>
          {player.number}. {player.firstName}
        </option>
      ))}
    </select>
  )
}
