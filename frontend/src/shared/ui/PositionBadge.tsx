// Colored pill with a position name, full ("Colocador") or short ("Co"). Every pill of the same kind
// has the same width, so lists line up.
import { POSITION_COLORS, POSITION_LABELS, POSITION_SHORT_LABELS } from '@/shared/domain/labels'
import type { Position } from '@/shared/domain/types'

export function PositionBadge({
  position,
  short = false,
}: {
  position: Position
  short?: boolean
}) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full py-0.5 text-center text-xs font-semibold ${short ? 'w-8' : 'w-[5.5rem]'} ${POSITION_COLORS[position]}`}
    >
      {short ? POSITION_SHORT_LABELS[position] : POSITION_LABELS[position]}
    </span>
  )
}
