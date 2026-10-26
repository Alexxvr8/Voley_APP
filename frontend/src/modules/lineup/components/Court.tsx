// Starting rotation editor: the six zones drawn as on court, each colored by the role
// the selected system expects there.
import { POSITION_COLORS, POSITION_LABELS } from '@/shared/domain/labels'
import type { GameSystem, Player } from '@/shared/domain/types'
import { PlayerSelect } from '@/shared/ui/PlayerSelect'
import { canPlay } from '../setPlan'
import { COURT_ROWS, ZONE_ROLES, type Zone } from '../systems'

interface CourtProps {
  system: GameSystem
  rotation: Partial<Record<Zone, string>>
  /** Players that can be placed (the called-up ones). */
  candidates: Player[]
  /** When false, each zone only offers players who can play its expected role. */
  showAll: boolean
  onAssign: (zone: Zone, playerId: string | undefined) => void
}

export function Court({ system, rotation, candidates, showAll, onAssign }: CourtProps) {
  /** Players a zone can offer: not placed in another zone and, unless showAll, fit for the role. */
  function optionsForZone(zone: Zone): Player[] {
    const role = ZONE_ROLES[system][zone]
    const placedElsewhere = new Set(
      Object.entries(rotation)
        .filter(([otherZone]) => Number(otherZone) !== zone)
        .map(([, playerId]) => playerId),
    )
    return candidates.filter((player) => !placedElsewhere.has(player.id) && (showAll || canPlay(player, role)))
  }

  return (
    <div className="rounded-2xl bg-orange-200 p-2">
      <div className="mb-2 h-1.5 rounded-full bg-slate-800" title="Red" />
      <div className="grid grid-cols-3 gap-2">
        {COURT_ROWS.flat().map((zone) => {
          const role = ZONE_ROLES[system][zone]
          return (
            <label key={zone} className={`flex flex-col gap-1 rounded-xl p-2 ${POSITION_COLORS[role]}`}>
              <span className="text-[11px] font-semibold uppercase opacity-90">
                Z{zone} · {POSITION_LABELS[role]}
              </span>
              <PlayerSelect
                players={optionsForZone(zone)}
                value={rotation[zone]}
                onChange={(playerId) => onAssign(zone, playerId)}
                className="w-full rounded-lg bg-white/90 px-1 py-1.5 text-sm font-medium text-slate-900"
              />
            </label>
          )
        })}
      </div>
    </div>
  )
}
