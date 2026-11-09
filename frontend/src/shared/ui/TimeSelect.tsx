// 24-hour time picker: a field showing "18:30" that opens a panel with the hours and the minutes as
// big buttons (hour, then minutes: two taps). The browser's own time input follows the phone
// language and can show AM/PM, so it is not used.
import { useState } from 'react'
import { PickerSheet } from './PickerSheet'

interface TimeSelectProps {
  /** `HH:MM`, or empty when no time is chosen. */
  value: string
  onChange: (value: string) => void
  /** Minute step: 5 for matches, 15 for trainings. */
  step?: number
  /** Accessible name and panel title, e.g. "Hora del partido". */
  label: string
  /** Allows "no time" (a "Sin hora" button). Without it, give a default value. */
  optional?: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')
const HOURS = Array.from({ length: 24 }, (_, h) => pad(h))

/** Grid button, highlighted when chosen. */
function Chip({ text, on, onClick }: { text: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-xl py-2.5 text-base font-semibold tabular-nums transition ${
        on
          ? 'bg-blue-800 text-white shadow-sm'
          : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-900'
      }`}
    >
      {text}
    </button>
  )
}

export function TimeSelect({
  value,
  onChange,
  step = 5,
  label,
  optional = false,
}: TimeSelectProps) {
  const [open, setOpen] = useState(false)
  const [hour, setHour] = useState('')
  const minutes = Array.from({ length: 60 / step }, (_, i) => pad(i * step))
  const [savedHour, savedMinute] = value ? value.split(':') : ['', '']

  function openPanel() {
    setHour(savedHour)
    setOpen(true)
  }

  function pickMinute(minute: string) {
    onChange(`${hour}:${minute}`)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        aria-label={`${label}: ${value || 'sin hora'}`}
        className="flex min-w-28 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-base outline-none hover:border-blue-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
      >
        <span aria-hidden className="text-slate-400">
          🕒
        </span>
        <span
          className={`font-semibold tabular-nums ${value ? 'text-slate-900' : 'text-slate-400'}`}
        >
          {value || '--:--'}
        </span>
      </button>

      {open && (
        <PickerSheet title={label} onClose={() => setOpen(false)}>
          <p className="text-center text-4xl font-bold text-slate-900 tabular-nums">
            {hour || '--'}
            <span className="text-slate-300">:</span>
            {hour && hour === savedHour ? savedMinute : '--'}
          </p>

          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Hora</p>
            <div className="grid grid-cols-6 gap-1.5">
              {HOURS.map((h) => (
                <Chip key={h} text={h} on={h === hour} onClick={() => setHour(h)} />
              ))}
            </div>
          </div>

          <div className={`space-y-2 ${hour ? '' : 'pointer-events-none opacity-40'}`}>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Minutos</p>
            <div className={`grid gap-1.5 ${minutes.length > 4 ? 'grid-cols-6' : 'grid-cols-4'}`}>
              {minutes.map((m) => (
                <Chip
                  key={m}
                  text={`:${m}`}
                  on={hour === savedHour && m === savedMinute}
                  onClick={() => pickMinute(m)}
                />
              ))}
            </div>
          </div>

          {optional && value && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="w-full rounded-xl py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            >
              Sin hora
            </button>
          )}
        </PickerSheet>
      )}
    </>
  )
}
