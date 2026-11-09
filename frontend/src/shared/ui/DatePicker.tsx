// Date field: shows "sábado, 14 de noviembre" and opens a month panel (Monday first) to pick the day
// with one tap. Replaces the browser's date input, which looks different on every phone.
import { useState } from 'react'
import { monthGrid, monthOf, shiftMonth } from '@/shared/utils/calendar'
import { formatLongDate, todayIso } from '@/shared/utils/format'
import { PickerSheet } from './PickerSheet'

interface DatePickerProps {
  /** `YYYY-MM-DD`, or empty when no date is chosen. */
  value: string
  onChange: (isoDate: string) => void
  /** Accessible name and panel title, e.g. "Fecha del partido". */
  label: string
}

const WEEKDAY_INITIALS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })

export function DatePicker({ value, onChange, label }: DatePickerProps) {
  const today = todayIso()
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => monthOf(value || today))

  function openPanel() {
    setMonth(monthOf(value || today))
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        aria-label={`${label}: ${value ? formatLongDate(value) : 'sin fecha'}`}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-base outline-none hover:border-blue-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-200"
      >
        <span aria-hidden className="text-slate-400">
          📅
        </span>
        <span
          className={`font-semibold first-letter:uppercase ${value ? 'text-slate-900' : 'text-slate-400'}`}
        >
          {value ? formatLongDate(value) : 'Elige la fecha'}
        </span>
      </button>

      {open && (
        <PickerSheet title={label} onClose={() => setOpen(false)}>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, -1))}
              aria-label="Mes anterior"
              className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-700 hover:bg-slate-200"
            >
              ‹
            </button>
            <p className="font-bold text-slate-900 first-letter:uppercase">
              {monthFormatter.format(new Date(month.year, month.month, 1))}
            </p>
            <button
              type="button"
              onClick={() => setMonth(shiftMonth(month, 1))}
              aria-label="Mes siguiente"
              className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-700 hover:bg-slate-200"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
            {WEEKDAY_INITIALS.map((initial) => (
              <span key={initial}>{initial}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthGrid(month)
              .flat()
              .map((date, index) => {
                if (!date) return <span key={`blank-${index}`} />
                const selected = date === value
                const isToday = date === today
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => {
                      onChange(date)
                      setOpen(false)
                    }}
                    aria-pressed={selected}
                    aria-label={formatLongDate(date)}
                    className={`flex aspect-square items-center justify-center rounded-full text-sm font-semibold tabular-nums transition ${
                      selected
                        ? 'bg-blue-800 text-white shadow-sm'
                        : isToday
                          ? 'text-blue-800 ring-2 ring-blue-200 ring-inset hover:bg-blue-50'
                          : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {Number(date.slice(8))}
                  </button>
                )
              })}
          </div>

          <button
            type="button"
            onClick={() => {
              onChange(today)
              setOpen(false)
            }}
            className="w-full rounded-xl py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
          >
            Hoy
          </button>
        </PickerSheet>
      )}
    </>
  )
}
