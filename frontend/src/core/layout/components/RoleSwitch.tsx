// "Ver como" toggle that simulates the user's team role until roles come from team_members (phase 1).
import type { TeamRole } from '@/core/modules/types'
import { useSession } from '@/core/session/session'

const ROLE_OPTIONS: { role: TeamRole; label: string }[] = [
  { role: 'coach', label: 'Entrenador' },
  { role: 'player', label: 'Jugador' },
]

export function RoleSwitch() {
  const { role, setRole } = useSession()

  return (
    <div
      className="flex rounded-full bg-blue-950/60 p-0.5 text-xs"
      role="group"
      aria-label="Ver como"
    >
      {ROLE_OPTIONS.map((option) => (
        <button
          key={option.role}
          type="button"
          onClick={() => setRole(option.role)}
          className={`flex-1 rounded-full px-3 py-1 font-semibold ${
            role === option.role ? 'bg-white text-blue-900' : 'text-blue-100 hover:text-white'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
