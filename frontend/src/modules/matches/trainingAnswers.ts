// Training attendance helpers: the next trainings to answer and the count of answers for one
// training on one date (no React here).
import type {
  AvailabilityStatus,
  TrainingAnswer,
  TrainingCancellation,
  TrainingSlot,
} from '@/shared/domain/types'
import { trainingsOn, type TrainingOnDate } from '@/shared/utils/calendar'
import { parseLocalDate, toIsoDate } from '@/shared/utils/format'

/** Days looked ahead for the next trainings (two weeks covers any weekly schedule). */
const LOOKAHEAD_DAYS = 14

/** Next trainings that are not cancelled, from today on, soonest first. */
export function upcomingTrainings(
  slots: TrainingSlot[],
  cancellations: TrainingCancellation[],
  todayIso: string,
  limit: number,
): TrainingOnDate[] {
  const found: TrainingOnDate[] = []
  const day = parseLocalDate(todayIso)
  for (let i = 0; i < LOOKAHEAD_DAYS && found.length < limit; i++) {
    const date = toIsoDate(day)
    found.push(...trainingsOn(date, slots, cancellations).filter((t) => !t.cancelled))
    day.setDate(day.getDate() + 1)
  }
  return found.slice(0, limit)
}

/** The answer of a player for one training on one date, if any. */
export function answerOf(
  answers: TrainingAnswer[],
  training: Pick<TrainingOnDate, 'date'> & { slotId: string },
  playerId: string,
): AvailabilityStatus | undefined {
  return answers.find(
    (a) => a.slotId === training.slotId && a.date === training.date && a.playerId === playerId,
  )?.status
}

/** How many said yes, no or maybe to one training on one date. */
export function answerCounts(
  answers: TrainingAnswer[],
  slotId: string,
  date: string,
): Record<AvailabilityStatus, number> {
  const counts = { yes: 0, no: 0, maybe: 0 }
  for (const answer of answers) {
    if (answer.slotId === slotId && answer.date === date) counts[answer.status]++
  }
  return counts
}
