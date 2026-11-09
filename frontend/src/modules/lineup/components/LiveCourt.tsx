// Big read-only court for the match mode: each zone shows the role colour, the shirt number large
// and the first name, so it can be read from the bench.
import { POSITION_COLORS, POSITION_LABELS, POSITION_SHORT_LABELS } from '@/shared/domain/labels'
import type { Player, Position } from '@/shared/domain/types'
import { COURT_ROWS, type Zone } from '../systems'
import { shortName } from '@/shared/utils/format'

interface LiveCourtProps {
  lineup: Partial<Record<Zone, string>>
  roles: Record<Zone, Position>
  playersById: Map<string, Player>
}

export function LiveCourt({ lineup, roles, playersById }: LiveCourtProps) {
  return (
    <div className="rounded-2xl bg-orange-200 p-2">
      <div className="mb-2 h-2 rounded-full bg-slate-800" title="Red" />
      <div className="grid grid-cols-3 gap-2">
        {COURT_ROWS.flat().map((zone) => {
          const player = lineup[zone] ? playersById.get(lineup[zone]!) : undefined
          return (
            <div
              key={zone}
              title={POSITION_LABELS[roles[zone]]}
              className={`flex min-h-28 flex-col items-center justify-center rounded-xl p-2 text-center lg:min-h-36 ${POSITION_COLORS[roles[zone]]}`}
            >
              <span className="text-[11px] font-bold tracking-wide opacity-80">
                Z{zone} · {POSITION_SHORT_LABELS[roles[zone]]}
              </span>
              <span className="text-4xl leading-none font-black lg:text-5xl">
                {player?.number ?? '–'}
              </span>
              <span className="mt-1 max-w-full truncate text-sm font-semibold lg:text-base">
                {player ? shortName(player) : 'Sin asignar'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
