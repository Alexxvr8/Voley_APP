// A weekly training on a specific date. Players answer whether they come (Sí / No / Duda); staff see
// how many answered each and can cancel the training for that day or bring it back.
import type { AvailabilityStatus } from '@/shared/domain/types'
import { AvailabilityButtons } from '@/shared/ui/AvailabilityButtons'
import { Card } from '@/shared/ui/Card'
import type { TrainingOnDate } from '@/shared/utils/calendar'
import { formatShortDate } from '@/shared/utils/format'
import { mapsOpenUrl } from '@/shared/utils/maps'

interface TrainingEventCardProps {
  training: TrainingOnDate
  /** Shows the date in the title (lists with several days, like "Próximos entrenamientos"). */
  showDate?: boolean
  /** Present for players: their answer and how to change it. */
  attendance?: {
    status: AvailabilityStatus | undefined
    onChange: (status: AvailabilityStatus) => void
  }
  /** Present for staff: how many answered yes, no or maybe. */
  counts?: Record<AvailabilityStatus, number>
  /** Present for staff: toggles the cancellation of this date. */
  onToggleCancelled?: () => void
}

export function TrainingEventCard({
  training,
  showDate = false,
  attendance,
  counts,
  onToggleCancelled,
}: TrainingEventCardProps) {
  const { slot, cancelled } = training

  return (
    <Card
      className={`space-y-3 border-l-4 ${cancelled ? 'border-l-slate-300 opacity-70' : 'border-l-emerald-500'}`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {showDate && (
            <p className="text-xs font-semibold text-slate-500 first-letter:uppercase">
              {formatShortDate(training.date)}
            </p>
          )}
          <p
            className={`font-semibold ${cancelled ? 'text-slate-500 line-through' : 'text-slate-900'}`}
          >
            Entrenamiento · {slot.startTime}–{slot.endTime}
          </p>
          {(slot.venue || slot.mapsUrl) && (
            <a
              href={mapsOpenUrl(slot.mapsUrl, slot.venue)}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-800 underline"
            >
              {slot.venue || 'Ver en Google Maps'}
            </a>
          )}
          {cancelled && <p className="text-sm font-semibold text-rose-700">Cancelado este día</p>}
        </div>
        {onToggleCancelled && (
          <button
            type="button"
            onClick={onToggleCancelled}
            className="shrink-0 text-xs font-medium text-blue-800 underline"
          >
            {cancelled ? 'Recuperar' : 'Cancelar este día'}
          </button>
        )}
      </div>

      {counts && !cancelled && (
        <p className="flex gap-4 text-sm">
          <span className="text-emerald-700">Sí {counts.yes}</span>
          <span className="text-rose-700">No {counts.no}</span>
          <span className="text-amber-700">Duda {counts.maybe}</span>
        </p>
      )}
      {attendance && !cancelled && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500">¿Vienes?</p>
          <AvailabilityButtons value={attendance.status} onChange={attendance.onChange} />
        </div>
      )}
    </Card>
  )
}
