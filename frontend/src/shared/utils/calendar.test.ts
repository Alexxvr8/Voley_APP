// Tests for the monthly grid and the weekly trainings shown on each date.
import { describe, expect, it } from 'vitest'
import type { TrainingSlot } from '@/shared/domain/types'
import { isoWeekday, monthGrid, shiftMonth, trainingsOn } from './calendar'
import { parseLocalDate } from './format'

const monday: TrainingSlot = {
  id: 'a',
  weekday: 1,
  startTime: '18:00',
  endTime: '19:30',
  venue: '',
  mapsUrl: '',
}

describe('monthGrid', () => {
  it('starts on Monday and pads the first week (November 2026 starts on a Sunday)', () => {
    const weeks = monthGrid({ year: 2026, month: 10 })
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-11-01'])
    expect(weeks.every((week) => week.length === 7)).toBe(true)
    expect(weeks.flat().filter(Boolean)).toHaveLength(30)
  })
})

describe('shiftMonth', () => {
  it('crosses the year boundary', () => {
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 })
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 })
  })
})

describe('trainingsOn', () => {
  it('uses ISO weekdays (Monday = 1)', () => {
    expect(isoWeekday(parseLocalDate('2026-11-09'))).toBe(1)
    expect(isoWeekday(parseLocalDate('2026-11-08'))).toBe(7)
  })

  it('lists the weekly slot on its weekday and marks a cancelled date', () => {
    expect(trainingsOn('2026-11-09', [monday], [])).toEqual([
      { slot: monday, date: '2026-11-09', cancelled: false },
    ])
    expect(trainingsOn('2026-11-10', [monday], [])).toEqual([])
    const cancelled = trainingsOn('2026-11-16', [monday], [{ slotId: 'a', date: '2026-11-16' }])
    expect(cancelled[0].cancelled).toBe(true)
  })
})
