// Monthly calendar, Monday first. Each day shows a bubble per event: blue for a match, green for a training.
// The bubbles grow with the calendar's own width: dots, then the time, then time and label.
import { shiftMonth, monthGrid, type CalendarMonth } from '@/shared/utils/calendar'
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
      ? 'bg-blue-700 @lg:text-white'
      : 'bg-emerald-500 @lg:bg-emerald-100 @lg:text-emerald-900'
  return (
    <span
      title={`${time} ${label}`.trim()}
      className={`block size-2.5 shrink-0 rounded-full @lg:size-auto @lg:w-full @lg:rounded-md @lg:px-1 @lg:py-0.5 @lg:text-left @lg:text-[11px] @lg:leading-tight @lg:font-semibold ${colors}`}
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
    <span className="flex w-full flex-wrap justify-center gap-1 @lg:flex-col @lg:flex-nowrap">
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

  return (
    <div className="@container rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(month, -1))}
          aria-label="Mes anterior"
          className="size-10 rounded-full text-xl text-slate-600 hover:bg-slate-100"
        >
          ‹
        </button>
        <p className="font-bold text-slate-900 first-letter:uppercase">{title}</p>
        <button
          type="button"
          onClick={() => onMonthChange(shiftMonth(month, 1))}
          aria-label="Mes siguiente"
          className="size-10 rounded-full text-xl text-slate-600 hover:bg-slate-100"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
        {WEEKDAY_INITIALS.map((initial) => (
          <span key={initial}>{initial}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {monthGrid(month)
          .flat()
          .map((date, index) => {
            if (!date) return <span key={`blank-${index}`} />
            const isSelected = date === selectedDate
            const isToday = date === today
            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelectDate(date)}
                aria-pressed={isSelected}
                aria-label={date}
                className={`flex min-h-14 min-w-0 flex-col items-center gap-1 overflow-hidden rounded-xl p-1 @lg:min-h-20 @lg:items-stretch @2xl:min-h-24 ${
                  isSelected ? 'bg-blue-50 ring-2 ring-blue-700' : 'hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center self-center rounded-full text-sm @lg:self-start ${
                    isToday ? 'bg-blue-800 font-bold text-white' : 'text-slate-800'
                  }`}
                >
                  {Number(date.slice(8))}
                </span>
                <DayBubbles events={eventsOn(date)} />
              </button>
            )
          })}
      </div>

      <div className="mt-3 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-blue-700" /> Partido
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-emerald-500" /> Entrenamiento
        </span>
      </div>
    </div>
  )
}
