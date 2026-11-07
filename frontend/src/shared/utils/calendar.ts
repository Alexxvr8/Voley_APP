// Pure helpers for the monthly calendar: the grid of days and which trainings fall on each date.
import type { TrainingCancellation, TrainingSlot } from '@/shared/domain/types'
import { parseLocalDate, toIsoDate } from './format'

/** Year and month (0 = January) shown by a calendar. */
export interface CalendarMonth {
  year: number
  month: number
}

export function monthOf(isoDate: string): CalendarMonth {
  const date = parseLocalDate(isoDate)
  return { year: date.getFullYear(), month: date.getMonth() }
}

export function shiftMonth({ year, month }: CalendarMonth, delta: number): CalendarMonth {
  const date = new Date(year, month + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() }
}

/** ISO weekday of a local date: 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1
}

/**
 * Weeks of the month, Monday first, as `YYYY-MM-DD` strings.
 * Days before the 1st and after the last day are `null` so the grid lines up.
 */
export function monthGrid({ year, month }: CalendarMonth): (string | null)[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = isoWeekday(new Date(year, month, 1)) - 1
  const cells: (string | null)[] = Array(leadingBlanks).fill(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(toIsoDate(new Date(year, month, day)))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** A weekly training on a specific date, possibly cancelled for that day. */
export interface TrainingOnDate {
  slot: TrainingSlot
  date: string
  cancelled: boolean
}

/** Trainings scheduled on a date, in start-time order, marking the ones cancelled for that day. */
export function trainingsOn(
  isoDate: string,
  slots: TrainingSlot[],
  cancellations: TrainingCancellation[],
): TrainingOnDate[] {
  const weekday = isoWeekday(parseLocalDate(isoDate))
  return slots
    .filter((slot) => slot.weekday === weekday)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((slot) => ({
      slot,
      date: isoDate,
      cancelled: cancellations.some((c) => c.slotId === slot.id && c.date === isoDate),
    }))
}
