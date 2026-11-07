// A weekly training on a specific date. Staff can cancel it for that day or bring it back.
import type { TrainingOnDate } from '@/shared/utils/calendar'
import { Card } from '@/shared/ui/Card'

interface TrainingEventCardProps {
  training: TrainingOnDate
  /** Present for staff: toggles the cancellation of this date. */
  onToggleCancelled?: () => void
}

export function TrainingEventCard({ training, onToggleCancelled }: TrainingEventCardProps) {
  const { slot, cancelled } = training

  return (
    <Card
      className={`flex items-center gap-3 border-l-4 ${cancelled ? 'border-l-slate-300 opacity-70' : 'border-l-emerald-500'}`}
    >
      <div className="min-w-0 flex-1">
        <p
          className={`font-semibold ${cancelled ? 'text-slate-500 line-through' : 'text-slate-900'}`}
        >
          Entrenamiento · {slot.startTime}–{slot.endTime}
        </p>
        {slot.venue && <p className="text-sm text-slate-500">{slot.venue}</p>}
        {cancelled && <p className="text-sm font-semibold text-rose-700">Cancelado este día</p>}
      </div>
      {onToggleCancelled && (
        <button
          type="button"
          onClick={onToggleCancelled}
          className="text-xs font-medium text-blue-800 underline"
        >
          {cancelled ? 'Recuperar' : 'Cancelar este día'}
        </button>
      )}
    </Card>
  )
}
