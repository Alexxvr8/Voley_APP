// Colored pill with a position name, full ("Colocador") or short ("COL").
import { POSITION_COLORS, POSITION_LABELS, POSITION_SHORT_LABELS } from '@/shared/domain/labels'
import type { Position } from '@/shared/domain/types'

export function PositionBadge({ position, short = false }: { position: Position; short?: boolean }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${POSITION_COLORS[position]}`}>
      {short ? POSITION_SHORT_LABELS[position] : POSITION_LABELS[position]}
    </span>
  )
}
