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

/** Matches from today on, soonest first. */
export function upcomingMatches(matches: Match[], todayIso: string, limit: number): Match[] {
  return matches.filter((match) => match.date >= todayIso).slice(0, limit)
}
