// Tests of the MVP rules: vote phase, picking, time left and season ranking.
import { describe, expect, it } from 'vitest'
import type { Match, Player } from '@/shared/domain/types'
import { closesInLabel, samePick, seasonRanking, togglePick, topVoted, votePhase } from './mvp'

const NOW = new Date('2026-11-09T12:00:00Z')

function match(overrides: Partial<Match>): Match {
  return {
    id: 'm',
    seasonId: 's1',
    opponent: 'Rival',
    date: '2026-11-08',
    matchTime: '',
    warmupMinutes: null,
    venue: '',
    mapsUrl: '',
    homeAway: 'home',
    notes: '',
    status: 'played',
    setsResult: [],
    setsFormat: 'best_of_5',
    finalScore: null,
    mvpStatus: 'closed',
    mvpClosesAt: null,
    mvpWinners: [],
    ...overrides,
  }
}

function player(id: string, firstName: string, competes = true, active = true): Player {
  return {
    id,
    firstName,
    lastName: '',
    nickname: '',
    birthYear: null,
    number: null,
    mainPosition: 'outside',
    otherPositions: [],
    competes,
    active,
    membership: 'member',
    visitWeekdays: [],
    visitDate: null,
  }
}

describe('votePhase', () => {
  it('tells an open vote from one whose 48 h are over', () => {
    expect(votePhase(match({ mvpStatus: 'open', mvpClosesAt: '2026-11-10T12:00:00Z' }), NOW)).toBe(
      'open',
    )
    expect(votePhase(match({ mvpStatus: 'open', mvpClosesAt: '2026-11-09T11:59:00Z' }), NOW)).toBe(
      'expired',
    )
  })

  it('maps the other statuses', () => {
    expect(votePhase(match({ mvpStatus: 'closed' }), NOW)).toBe('none')
    expect(votePhase(match({ mvpStatus: 'tie_pending' }), NOW)).toBe('tie')
    expect(votePhase(match({ mvpStatus: 'finished' }), NOW)).toBe('finished')
  })
})

describe('togglePick', () => {
  it('adds and removes players', () => {
    expect(togglePick([], 'a')).toEqual(['a'])
    expect(togglePick(['a'], 'b')).toEqual(['a', 'b'])
    expect(togglePick(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('drops the oldest choice when the pick is full', () => {
    expect(togglePick(['a', 'b'], 'c')).toEqual(['b', 'c'])
  })
})

describe('samePick', () => {
  it('ignores the order', () => {
    expect(samePick(['a', 'b'], ['b', 'a'])).toBe(true)
    expect(samePick(['a'], ['a', 'b'])).toBe(false)
  })
})

describe('closesInLabel', () => {
  it('uses hours, minutes or less than a minute', () => {
    expect(closesInLabel('2026-11-10T11:30:00Z', NOW)).toBe('Cierra en 23 h')
    expect(closesInLabel('2026-11-09T12:40:00Z', NOW)).toBe('Cierra en 40 min')
    expect(closesInLabel('2026-11-09T12:00:30Z', NOW)).toBe('Cierra en menos de 1 min')
  })
})

describe('seasonRanking', () => {
  const players = [
    player('a', 'Ana'),
    player('b', 'Bea'),
    player('c', 'Carla'),
    player('t', 'Tina', false),
    player('x', 'Xenia', true, false),
  ]
  const matches = [
    match({ id: '1', mvpStatus: 'finished', mvpWinners: ['b'] }),
    match({ id: '2', mvpStatus: 'finished', mvpWinners: ['a', 'b'] }),
    match({ id: '3', mvpStatus: 'tie_pending', mvpWinners: [] }),
    match({ id: '4', mvpStatus: 'finished', mvpWinners: [] }),
  ]

  it('counts a co-MVP once for each winner and hides zeros from players', () => {
    expect(seasonRanking(matches, players, false).map((e) => [e.player.id, e.wins])).toEqual([
      ['b', 2],
      ['a', 1],
    ])
  })

  it('lists every competing player still in the team for the coach', () => {
    expect(seasonRanking(matches, players, true).map((e) => [e.player.id, e.wins])).toEqual([
      ['b', 2],
      ['a', 1],
      ['c', 0],
    ])
  })
})

describe('topVoted', () => {
  it('returns every player tied at the top', () => {
    const votes = [
      { playerId: 'a', votes: 3 },
      { playerId: 'b', votes: 3 },
      { playerId: 'c', votes: 1 },
    ]
    expect(topVoted(votes)).toEqual(['a', 'b'])
    expect(topVoted([])).toEqual([])
  })
})
