// Monthly calendar, Monday first, with "Hoy" to come back. Each day shows a bubble per event: blue
// for a match, green for a training. The bubbles grow with the calendar's own width: dots, then the
// time, then time and label. Past days are greyed out.
import { monthGrid, monthOf, shiftMonth, type CalendarMonth } from '@/shared/utils/calendar'
import type { DayEvents } from '../calendarEvents'

const WEEKDAY_INITIALS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const monthFormatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' })

interface MonthCalendarProps {
  month: CalendarMonth
  onMonthChange: (month: CalendarMonth) => void
  selectedDate: string
  onSelectDate: (isoDate: string) => void
  today: string
  eventsOn: (isoDate: string) => DayEvents
}

/** One event inside a day cell. Its size follows the calendar width (container queries), not the screen. */
function EventBubble({
  kind,
  time,
  label,
}: {
  kind: 'match' | 'training'
  time: string
  label: string
}) {
  const colors =
    kind === 'match'
      ? 'bg-blue-600 @lg:bg-blue-100 @lg:text-blue-900 @lg:border-blue-600'
      : 'bg-emerald-500 @lg:bg-emerald-50 @lg:text-emerald-900 @lg:border-emerald-500'
  return (
    <span
      title={`${time} ${label}`.trim()}
      className={`block size-2 shrink-0 rounded-full @lg:size-auto @lg:w-full @lg:rounded-md @lg:border-l-[3px] @lg:px-1.5 @lg:py-0.5 @lg:text-left @lg:text-[11px] @lg:leading-tight @lg:font-semibold ${colors}`}
    >
      {/* Narrow calendar: just the dot. Medium: the time. Wide: time and what it is, up to two lines. */}
      <span className="hidden @lg:block @2xl:hidden">{time || label}</span>
      <span className="hidden @2xl:line-clamp-2">
        {time && <span className="opacity-80">{time} </span>}
        {label}
      </span>
    </span>
  )
}

function DayBubbles({ events }: { events: DayEvents }) {
  const activeTrainings = events.trainings.filter((training) => !training.cancelled)
  return (
    <span className="flex w-full flex-wrap justify-center gap-0.5 @lg:flex-col @lg:flex-nowrap @lg:gap-1">
      {events.matches.map((match) => (
        <EventBubble
          key={match.id}
          kind="match"
          time={match.matchTime}
          label={`vs ${match.opponent}`}
        />
      ))}
      {activeTrainings.map((training) => (
        <EventBubble
          key={training.slot.id}
          kind="training"
          time={training.slot.startTime}
          label="Entreno"
        />
      ))}
    </span>
  )
}

export function MonthCalendar({
  month,
  onMonthChange,
  selectedDate,
  onSelectDate,
  today,
  eventsOn,
}: MonthCalendarProps) {
  const title = monthFormatter.format(new Date(month.year, month.month, 1))

  const showingTodayMonth =
    month.year === monthOf(today).year && month.month === monthOf(today).month

  return (
    <div className="@container rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70 lg:p-5">
      <div className="mb-4 flex items-center gap-2">
        <p className="flex-1 pl-1 text-lg font-bold text-slate-900 first-letter:uppercase">
          {title}
        </p>
        {!showingTodayMonth && (
          <button
            type="button"
            onClick={() => {
              onMonthChange(monthOf(today))
              onSelectDate(today)
            }}
            className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800 hover:bg-blue-100"
          >
            Hoy
          </button>
        )}
        <div className="flex rounded-full bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            aria-label="Mes anterior"
            className="flex size-9 items-center justify-center rounded-full text-xl text-slate-600 hover:bg-white hover:shadow-sm"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            aria-label="Mes siguiente"
            className="flex size-9 items-center justify-center rounded-full text-xl text-slate-600 hover:bg-white hover:shadow-sm"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
        {WEEKDAY_INITIALS.map((initial) => (
          <span key={initial}>{initial}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {monthGrid(month)
          .flat()
          .map((date, index) => {
            if (!date) return <span key={`blank-${index}`} />
            const isSelected = date === selectedDate
            const isToday = date === today
            const isPast = date < today
            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelectDate(date)}
                aria-pressed={isSelected}
                aria-label={date}
                className={`flex min-h-14 min-w-0 flex-col items-center gap-1 overflow-hidden rounded-2xl p-1 transition @lg:min-h-20 @lg:items-stretch @2xl:min-h-24 ${
                  isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center self-center rounded-full text-sm tabular-nums @lg:self-start ${
                    isSelected
                      ? 'bg-blue-800 font-bold text-white shadow-sm'
                      : isToday
                        ? 'font-bold text-blue-800 ring-2 ring-blue-200 ring-inset'
                        : isPast
                          ? 'text-slate-400'
                          : 'font-medium text-slate-800'
                  }`}
                >
                  {Number(date.slice(8))}
                </span>
                <DayBubbles events={eventsOn(date)} />
              </button>
            )
          })}
      </div>

      <div className="mt-4 flex gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-blue-600" /> Partido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500" /> Entrenamiento
        </span>
      </div>
    </div>
  )
}
