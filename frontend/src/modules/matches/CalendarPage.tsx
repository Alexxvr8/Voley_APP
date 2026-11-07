// "Partidos" screen: monthly calendar with matches and trainings, the selected day and the next matches.
// Players who compete answer availability from here; staff create matches and cancel single trainings.
import { useState } from 'react'
import { Link } from 'react-router'
import { hasRole, useCurrentTeam, useTeamPath } from '@/core/teams/currentTeam'
import type { AvailabilityStatus, Match } from '@/shared/domain/types'
import { PRIMARY_BUTTON_CLASS } from '@/shared/ui/form'
import { PageMessage } from '@/shared/ui/PageMessage'
import { monthOf, type CalendarMonth } from '@/shared/utils/calendar'
import { formatLongDate, todayIso } from '@/shared/utils/format'
import {
  useMatches,
  useMyAvailability,
  useMyCallups,
  usePlayers,
  useSetAvailability,
  useSetTrainingCancelled,
  useTrainingCancellations,
  useTrainingSlots,
} from './api'
import { eventsOn, upcomingMatches } from './calendarEvents'
import { MatchEventCard } from './components/MatchEventCard'
import { MonthCalendar } from './components/MonthCalendar'
import { TrainingEventCard } from './components/TrainingEventCard'

const UPCOMING_COUNT = 3

export function CalendarPage() {
  const { team, role, playerId } = useCurrentTeam()
  const teamPath = useTeamPath()
  const today = todayIso()
  const [selectedDate, setSelectedDate] = useState(today)
  const [month, setMonth] = useState<CalendarMonth>(monthOf(today))

  const matches = useMatches(team.id)
  const slots = useTrainingSlots(team.id)
  const cancellations = useTrainingCancellations(team.id)
  const players = usePlayers(team.id)
  const myAvailability = useMyAvailability(playerId)
  const myCallups = useMyCallups(playerId)
  const setAvailability = useSetAvailability()
  const setCancelled = useSetTrainingCancelled(team.id)

  if (matches.isPending || slots.isPending || cancellations.isPending || players.isPending) {
    return <PageMessage>Cargando…</PageMessage>
  }
  if (matches.isError || slots.isError || cancellations.isError || players.isError) {
    return <PageMessage>No se ha podido cargar el calendario. ¿Hay conexión?</PageMessage>
  }

  const isStaff = hasRole(role, 'assistant')
  // Only players who compete answer availability; the ones who only train just see the calendar.
  const competes = players.data.find((player) => player.id === playerId)?.competes ?? false
  const eventsFor = (date: string) => eventsOn(date, matches.data, slots.data, cancellations.data)
  const selected = eventsFor(selectedDate)

  function availabilityFor(match: Match) {
    if (!playerId || !competes) return undefined
    return {
      status: myAvailability.data?.[match.id],
      calledUp: myCallups.data?.includes(match.id) ?? false,
      onChange: (status: AvailabilityStatus) =>
        setAvailability.mutate({ matchId: match.id, playerId, status }),
    }
  }

  function selectDate(date: string) {
    setSelectedDate(date)
    setMonth(monthOf(date))
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Calendario</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => selectDate(today)}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50"
          >
            Hoy
          </button>
          {isStaff && (
            <Link to={teamPath('partidos/nuevo')} className={PRIMARY_BUTTON_CLASS}>
              + Partido
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          today={today}
          eventsOn={eventsFor}
        />

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="font-semibold text-slate-900 first-letter:uppercase">
              {formatLongDate(selectedDate)}
            </p>
            {selected.matches.length === 0 && selected.trainings.length === 0 && (
              <p className="text-sm text-slate-500">Nada este día.</p>
            )}
            {selected.matches.map((match) => (
              <MatchEventCard
                key={match.id}
                match={match}
                href={teamPath(`partidos/${match.id}`)}
                availability={availabilityFor(match)}
              />
            ))}
            {selected.trainings.map((training) => (
              <TrainingEventCard
                key={training.slot.id}
                training={training}
                onToggleCancelled={
                  isStaff
                    ? () =>
                        setCancelled.mutate({
                          slotId: training.slot.id,
                          date: training.date,
                          cancelled: !training.cancelled,
                        })
                    : undefined
                }
              />
            ))}
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-slate-900">Próximos partidos</p>
            {upcomingMatches(matches.data, today, UPCOMING_COUNT).map((match) => (
              <MatchEventCard
                key={match.id}
                match={match}
                href={teamPath(`partidos/${match.id}`)}
                availability={availabilityFor(match)}
              />
            ))}
            {upcomingMatches(matches.data, today, 1).length === 0 && (
              <p className="text-sm text-slate-500">No hay partidos programados.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
