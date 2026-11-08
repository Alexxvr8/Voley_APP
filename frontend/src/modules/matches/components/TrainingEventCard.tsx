// A weekly training on a specific date. Players answer whether they come (Sí / No / Duda); staff see
// how many answered each (and who, on tap) and can cancel the training for that day or bring it back.
import { useState } from 'react'
import type { AvailabilityStatus } from '@/shared/domain/types'
import { AvailabilityButtons } from '@/shared/ui/AvailabilityButtons'
import { Card } from '@/shared/ui/Card'
import type { TrainingOnDate } from '@/shared/utils/calendar'
import { formatShortDate, playerName } from '@/shared/utils/format'
import { mapsOpenUrl } from '@/shared/utils/maps'
import type { AnswerGroups } from '../trainingAnswers'

const GROUPS: { key: keyof AnswerGroups; label: string; color: string }[] = [
  { key: 'yes', label: 'Sí', color: 'text-emerald-700' },
  { key: 'no', label: 'No', color: 'text-rose-700' },
  { key: 'maybe', label: 'Duda', color: 'text-amber-700' },
  { key: 'none', label: 'Sin responder', color: 'text-slate-500' },
]

interface TrainingEventCardProps {
  training: TrainingOnDate
  /** Shows the date in the title (lists with several days, like "Próximos entrenamientos"). */
  showDate?: boolean
  /** Present for players: their answer and how to change it. */
  attendance?: {
    status: AvailabilityStatus | undefined
    onChange: (status: AvailabilityStatus) => void
  }
  /** Present for staff: the players grouped by their answer. */
  groups?: AnswerGroups
  /** Present for staff: toggles the cancellation of this date. */
  onToggleCancelled?: () => void
}

export function TrainingEventCard({
  training,
  showDate = false,
  attendance,
  groups,
  onToggleCancelled,
}: TrainingEventCardProps) {
  const { slot, cancelled } = training
  const [showNames, setShowNames] = useState(false)

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

      {groups && !cancelled && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowNames(!showNames)}
            aria-expanded={showNames}
            className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-left text-sm"
          >
            {GROUPS.map((group) => (
              <span key={group.key} className={group.color}>
                {group.label} {groups[group.key].length}
              </span>
            ))}
            <span className="ml-auto text-xs font-medium text-blue-800 underline">
              {showNames ? 'Ocultar' : 'Ver quién'}
            </span>
          </button>
          {showNames && (
            <dl className="space-y-1 text-sm">
              {GROUPS.filter((group) => groups[group.key].length > 0).map((group) => (
                <div key={group.key} className="flex gap-2">
                  <dt className={`shrink-0 font-semibold ${group.color}`}>{group.label}:</dt>
                  <dd className="text-slate-700">{groups[group.key].map(playerName).join(', ')}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
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
