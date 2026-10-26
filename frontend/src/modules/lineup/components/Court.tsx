// Starting lineup editor: the six zones drawn as on court, each colored by the role the
// system and rotation expect there, plus two grey boxes below for the liberos.
import { POSITION_COLORS, POSITION_LABELS } from '@/shared/domain/labels'
import type { GameSystem, Player } from '@/shared/domain/types'
import { PlayerSelect } from '@/shared/ui/PlayerSelect'
import { canPlay, type LiberoSlots } from '../setPlan'
import { COURT_ROWS, zoneRoles, type Zone } from '../systems'

interface CourtProps {
  system: GameSystem
  startRotation: number
  rotation: Partial<Record<Zone, string>>
  liberos: LiberoSlots
  /** Players that can be placed (the called-up ones). */
  candidates: Player[]
  /** When false, each box only offers players who can play its role. */
  showAll: boolean
  onAssign: (zone: Zone, playerId: string | undefined) => void
  onAssignLibero: (slot: 0 | 1, playerId: string | undefined) => void
}

const SELECT_CLASS = 'w-full rounded-lg bg-white/90 px-1 py-1.5 text-sm font-medium text-slate-900'
const LIBERO_SLOTS = [0, 1] as const

export function Court({
  system,
  startRotation,
  rotation,
  liberos,
  candidates,
  showAll,
  onAssign,
  onAssignLibero,
}: CourtProps) {
  const roles = zoneRoles(system, startRotation)

  /** Ids already used anywhere in the lineup (zones and libero boxes). */
  const usedIds = new Set([...Object.values(rotation), ...liberos].filter(Boolean))

  /** Players a box can offer: its current one, anyone not used yet and, unless showAll, fit for the role. */
  function optionsFor(currentId: string | undefined, fits: (player: Player) => boolean): Player[] {
    return candidates.filter(
      (player) => player.id === currentId || (!usedIds.has(player.id) && (showAll || fits(player))),
    )
  }

  // The libero boxes only appear if there is someone who can play libero (or "mostrar todos" is on).
  const hasLiberos = showAll || candidates.some((player) => canPlay(player, 'libero'))

  return (
    <div className="rounded-2xl bg-orange-200 p-2">
      <div className="mb-2 h-1.5 rounded-full bg-slate-800" title="Red" />
      <div className="grid grid-cols-3 gap-2">
        {COURT_ROWS.flat().map((zone) => {
          const role = roles[zone]
          return (
            <label key={zone} className={`flex flex-col gap-1 rounded-xl p-2 ${POSITION_COLORS[role]}`}>
              <span className="text-[11px] font-semibold uppercase opacity-90">
                Z{zone} · {POSITION_LABELS[role]}
              </span>
              <PlayerSelect
                players={optionsFor(rotation[zone], (player) => canPlay(player, role))}
                value={rotation[zone]}
                onChange={(playerId) => onAssign(zone, playerId)}
                className={SELECT_CLASS}
              />
            </label>
          )
        })}
      </div>

      {hasLiberos && (
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-orange-300 pt-2">
          {LIBERO_SLOTS.map((slot) => (
            <label key={slot} className="flex flex-col gap-1 rounded-xl bg-slate-400 p-2 text-white">
              <span className="text-[11px] font-semibold uppercase opacity-90">Líbero {slot + 1}</span>
              <PlayerSelect
                players={optionsFor(liberos[slot], (player) => canPlay(player, 'libero'))}
                value={liberos[slot]}
                onChange={(playerId) => onAssignLibero(slot, playerId)}
                className={SELECT_CLASS}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
