// Tests of the upcoming matches list of the calendar.
import { describe, expect, it } from 'vitest'
import type { Match } from '@/shared/domain/types'
import { upcomingMatches } from './calendarEvents'

function match(
  id: string,
  date: string,
  matchTime: string,
  status: Match['status'] = 'scheduled',
): Match {
  return {
    id,
    seasonId: 's',
    opponent: id,
    date,
    matchTime,
    warmupMinutes: null,
    venue: '',
    mapsUrl: '',
    homeAway: 'home',
    notes: '',
    status,
    setsResult: [],
    setsFormat: 'best_of_5',
    finalScore: null,
    mvpStatus: 'closed',
    mvpClosesAt: null,
    mvpWinners: [],
  }
}

describe('upcomingMatches', () => {
  it('leaves out past and already played matches, by date and time', () => {
    const matches = [
      match('past', '2026-11-08', '10:00'),
      match('played today', '2026-11-09', '10:00', 'played'),
      match('later today', '2026-11-09', '19:00'),
      match('earlier today', '2026-11-09', '12:00'),
      match('next week', '2026-11-16', '11:30'),
    ]
    expect(upcomingMatches(matches, '2026-11-09', 5).map((m) => m.id)).toEqual([
      'earlier today',
      'later today',
      'next week',
    ])
  })
})
