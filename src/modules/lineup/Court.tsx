import { POSITION_COLORS, POSITION_LABELS } from '@/shared/domain/labels'
import type { GameSystem, Player } from '@/shared/domain/types'
import { COURT_ROWS, ZONE_ROLES, type Zone } from './systems'

interface CourtProps {
  system: GameSystem
  rotation: Partial<Record<Zone, string>>
  candidates: Player[]
  showAll: boolean
  onAssign: (zone: Zone, playerId: string | undefined) => void
}

/** Starting rotation editor: zones 1–6 colored by expected role. */
export function Court({ system, rotation, candidates, showAll, onAssign }: CourtProps) {
  return (
    <div className="rounded-2xl bg-orange-200 p-2">
      <div className="mb-2 h-1.5 rounded-full bg-slate-800" title="Red" />
      <div className="grid grid-cols-3 gap-2">
        {COURT_ROWS.flat().map((zone) => {
          const role = ZONE_ROLES[system][zone]
          const takenElsewhere = new Set(
            Object.entries(rotation)
              .filter(([z]) => Number(z) !== zone)
              .map(([, id]) => id),
          )
          const options = candidates.filter(
            (p) =>
              !takenElsewhere.has(p.id) &&
              (showAll || p.mainPosition === role || p.otherPositions.includes(role)),
          )
          return (
            <label key={zone} className={`flex flex-col gap-1 rounded-xl p-2 ${POSITION_COLORS[role]}`}>
              <span className="text-[11px] font-semibold uppercase opacity-90">
                Z{zone} · {POSITION_LABELS[role]}
              </span>
              <select
                value={rotation[zone] ?? ''}
                onChange={(e) => onAssign(zone, e.target.value || undefined)}
                className="w-full rounded-lg bg-white/90 px-1 py-1.5 text-sm font-medium text-slate-900"
              >
                <option value="">—</option>
                {options.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.number}. {p.firstName}
                  </option>
                ))}
              </select>
            </label>
          )
        })}
      </div>
    </div>
  )
}
