// "¿Es del equipo?" in the player form: part of the team, comes on some weekdays (tap the days) or
// comes on one specific day (pick the date).
import { WEEKDAY_LABELS } from '@/shared/domain/labels'
import { MEMBERSHIP_LABELS, type MembershipValue } from '@/shared/domain/membership'
import type { Membership } from '@/shared/domain/types'
import { DatePicker } from './DatePicker'
import { LABEL_TEXT_CLASS } from './form'

interface MembershipFieldsProps {
  value: MembershipValue
  onChange: (value: MembershipValue) => void
  className?: string
}

const MEMBERSHIPS: Membership[] = ['member', 'regular', 'one_off']
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]

export function MembershipFields({ value, onChange, className = '' }: MembershipFieldsProps) {
  function toggleDay(day: number) {
    const days = value.visitWeekdays.includes(day)
      ? value.visitWeekdays.filter((other) => other !== day)
      : [...value.visitWeekdays, day].sort()
    onChange({ ...value, visitWeekdays: days })
  }

  return (
    <fieldset className={`space-y-2 ${className}`}>
      <legend className={LABEL_TEXT_CLASS}>¿Es del equipo?</legend>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
        {MEMBERSHIPS.map((membership) => (
          <button
            key={membership}
            type="button"
            aria-pressed={value.membership === membership}
            onClick={() => onChange({ ...value, membership })}
            className={`rounded-lg px-2 py-2 text-xs font-semibold sm:text-sm ${
              value.membership === membership
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {MEMBERSHIP_LABELS[membership]}
          </button>
        ))}
      </div>

      {value.membership === 'regular' && (
        <div className="space-y-1">
          <p className="text-xs text-slate-500">
            ¿Qué días viene? Se le pregunta por los entrenamientos de esos días y se le puede
            convocar a cualquier partido.
          </p>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => {
              const on = value.visitWeekdays.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={on}
                  aria-label={WEEKDAY_LABELS[day]}
                  onClick={() => toggleDay(day)}
                  className={`rounded-lg py-2 text-sm font-semibold ${
                    on ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {WEEKDAY_LABELS[day].slice(0, 2)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {value.membership === 'one_off' && (
        <div className="space-y-1">
          <p className="text-xs text-slate-500">
            Solo sale ese día: en la convocatoria de un partido de esa fecha o en el entrenamiento.
          </p>
          <DatePicker
            value={value.visitDate ?? ''}
            onChange={(visitDate) => onChange({ ...value, visitDate })}
            label="¿Qué día viene?"
          />
        </div>
      )}
    </fieldset>
  )
}
