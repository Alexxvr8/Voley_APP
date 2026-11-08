// Tests for the training attendance helpers.
import { describe, expect, it } from 'vitest'
import type { Player, TrainingAnswer, TrainingSlot } from '@/shared/domain/types'
import { answerGroups, answerOf, upcomingTrainings } from './trainingAnswers'

const slot = (id: string, weekday: number): TrainingSlot =>
  ({ id, weekday, startTime: '18:00', endTime: '19:30' }) as TrainingSlot

describe('upcomingTrainings', () => {
  // 2026-11-09 is a Monday (weekday 1) and 2026-11-11 a Wednesday (weekday 3).
  const slots = [slot('mon', 1), slot('wed', 3)]
  it('lists the next trainings in date order', () => {
    const next = upcomingTrainings(slots, [], '2026-11-08', 3)
    expect(next.map((t) => `${t.slot.id} ${t.date}`)).toEqual([
      'mon 2026-11-09',
      'wed 2026-11-11',
      'mon 2026-11-16',
    ])
  })
  it('skips cancelled dates', () => {
    const next = upcomingTrainings(slots, [{ slotId: 'mon', date: '2026-11-09' }], '2026-11-08', 1)
    expect(next[0].date).toBe('2026-11-11')
  })
})

describe('answers', () => {
  const answers: TrainingAnswer[] = [
    { slotId: 's', date: '2026-11-09', playerId: 'a', status: 'yes' },
    { slotId: 's', date: '2026-11-09', playerId: 'b', status: 'maybe' },
    { slotId: 's', date: '2026-11-16', playerId: 'a', status: 'no' },
  ]
  it('finds a player answer', () => {
    expect(answerOf(answers, { slotId: 's', date: '2026-11-16' }, 'a')).toBe('no')
    expect(answerOf(answers, { slotId: 's', date: '2026-11-16' }, 'b')).toBeUndefined()
  })
  it('groups the players of one date by answer', () => {
    const players = ['a', 'b', 'c'].map((id) => ({ id }) as Player)
    const ids = (list: Player[]) => list.map((player) => player.id)
    const groups = answerGroups(answers, players, 's', '2026-11-09')
    expect(ids(groups.yes)).toEqual(['a'])
    expect(ids(groups.maybe)).toEqual(['b'])
    expect(ids(groups.none)).toEqual(['c'])
    expect(groups.no).toEqual([])
  })
})
