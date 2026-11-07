// 24-hour time picker made of two dropdowns (hour 00–23, minutes in fixed steps). The browser's
// own time input follows the phone language and can show AM/PM, so it is not used.

interface TimeSelectProps {
  /** `HH:MM`, or empty when no time is chosen. */
  value: string
  onChange: (value: string) => void
  /** Minute step: 5 for matches, 15 for trainings. */
  step?: number
  /** Accessible name, e.g. "Hora del partido". */
  label: string
  /** Allows "no time" (an empty first option). */
  optional?: boolean
}

const SELECT_CLASS =
  'rounded-xl border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200'

const pad = (n: number) => String(n).padStart(2, '0')

export function TimeSelect({
  value,
  onChange,
  step = 5,
  label,
  optional = false,
}: TimeSelectProps) {
  const [hour, minute] = value ? value.split(':') : ['', '']
  const minutes = Array.from({ length: 60 / step }, (_, i) => pad(i * step))

  function change(nextHour: string, nextMinute: string) {
    if (!nextHour) return onChange('')
    onChange(`${nextHour}:${nextMinute || '00'}`)
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <select
        className={SELECT_CLASS}
        value={hour}
        onChange={(e) => change(e.target.value, minute)}
        aria-label={`${label}: hora`}
        required={!optional}
      >
        {(optional || !value) && <option value="">--</option>}
        {Array.from({ length: 24 }, (_, h) => (
          <option key={h} value={pad(h)}>
            {pad(h)}
          </option>
        ))}
      </select>
      <span className="font-bold text-slate-500">:</span>
      <select
        className={SELECT_CLASS}
        value={minutes.includes(minute) ? minute : ''}
        onChange={(e) => change(hour || '00', e.target.value)}
        aria-label={`${label}: minutos`}
        disabled={!hour}
      >
        {!minutes.includes(minute) && <option value="">--</option>}
        {minutes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  )
}
