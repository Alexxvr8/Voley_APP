// Yes / No / Maybe buttons used by players to answer availability.
import { AVAILABILITY_LABELS } from '@/shared/domain/labels'
import type { AvailabilityStatus } from '@/shared/domain/types'

const ACTIVE_STYLES: Record<AvailabilityStatus, string> = {
  yes: 'bg-emerald-600 text-white ring-emerald-600',
  no: 'bg-rose-600 text-white ring-rose-600',
  maybe: 'bg-amber-400 text-amber-950 ring-amber-400',
}

const STATUSES: AvailabilityStatus[] = ['yes', 'no', 'maybe']

/** One-tap availability selector (SPEC principle 3: two taps max for players). */
export function AvailabilityButtons({
  value,
  onChange,
}: {
  value: AvailabilityStatus | undefined
  onChange: (status: AvailabilityStatus) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onChange(status)}
          className={`rounded-xl py-2.5 text-sm font-semibold ring-1 transition ${
            value === status ? ACTIVE_STYLES[status] : 'bg-white text-slate-700 ring-slate-300 active:bg-slate-100'
          }`}
        >
          {AVAILABILITY_LABELS[status]}
        </button>
      ))}
    </div>
  )
}
