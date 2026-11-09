// Groups matches and trainings by date for the calendar (no React here).
import type { Match, TrainingCancellation, TrainingSlot } from '@/shared/domain/types'
import { trainingsOn, type TrainingOnDate } from '@/shared/utils/calendar'

/** What happens on one date. Cancelled trainings are kept so staff can bring them back. */
export interface DayEvents {
  matches: Match[]
  trainings: TrainingOnDate[]
}

export function eventsOn(
  isoDate: string,
  matches: Match[],
  slots: TrainingSlot[],
  cancellations: TrainingCancellation[],
): DayEvents {
  return {
    matches: matches.filter((match) => match.date === isoDate),
    trainings: trainingsOn(isoDate, slots, cancellations),
  }
}

/** Matches still to play, from today on, soonest first (by date and time). */
export function upcomingMatches(matches: Match[], todayIso: string, limit: number): Match[] {
  // A match already played today is not "upcoming" any more.
  return matches
    .filter((match) => match.date >= todayIso && match.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.matchTime.localeCompare(b.matchTime))
    .slice(0, limit)
}
