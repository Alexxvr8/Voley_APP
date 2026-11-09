// Tests for match results and per-match call-up positions.
import { describe, expect, it } from 'vitest'
import { asCalledUp } from './callups'
import {
  matchScore,
  possibleScores,
  resultSummary,
  setNumbersFor,
  setsDetail,
  setsWon,
} from './results'
import type { Player } from './types'

const player: Player = {
  id: 'p',
  firstName: 'Ana',
  lastName: '',
  birthYear: null,
  number: 7,
  mainPosition: 'outside',
  otherPositions: ['libero'],
  competes: true,
  active: true,
  membership: 'member',
  visitWeekdays: [],
  visitDate: null,
}

describe('results', () => {
  const sets = [
    { us: 25, them: 20 },
    { us: 23, them: 25 },
    { us: 25, them: 18 },
    { us: 25, them: 22 },
  ]
  it('counts sets and summarises', () => {
    expect(setsWon(sets)).toEqual({ us: 3, them: 1 })
    expect(resultSummary({ setsResult: sets, finalScore: null })).toBe('Ganado 3-1')
    expect(resultSummary({ setsResult: [], finalScore: null })).toBe('')
    expect(setsDetail(sets.slice(0, 2))).toBe('25-20 · 23-25')
  })
})

describe('score-only results', () => {
  it('uses the final score when there are no set points', () => {
    const result = { setsResult: [], finalScore: { us: 1, them: 2 } }
    expect(matchScore(result)).toEqual({ us: 1, them: 2 })
    expect(resultSummary(result)).toBe('Perdido 1-2')
  })
  it('lists the possible scores of each format', () => {
    const asText = (format: Parameters<typeof possibleScores>[0]) =>
      possibleScores(format).map((score) => `${score.us}-${score.them}`)
    expect(asText('best_of_5')).toEqual(['3-0', '3-1', '3-2', '2-3', '1-3', '0-3'])
    expect(asText('best_of_3')).toEqual(['2-0', '2-1', '1-2', '0-2'])
    expect(asText('fixed_3')).toEqual(['3-0', '2-1', '1-2', '0-3'])
    expect(asText('fixed_1')).toEqual(['1-0', '0-1'])
  })
})

describe('setNumbersFor', () => {
  it('follows the match format', () => {
    expect(setNumbersFor('best_of_3')).toEqual([1, 2, 3])
    expect(setNumbersFor('fixed_1')).toEqual([1])
    expect(setNumbersFor(undefined)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('asCalledUp', () => {
  it('keeps the roster values without overrides', () => {
    expect(asCalledUp(player, { playerId: 'p', number: null, positions: null })).toEqual(player)
  })
  it('applies the match number and several match positions', () => {
    const inMatch = asCalledUp(player, {
      playerId: 'p',
      number: 12,
      positions: ['opposite', 'outside'],
    })
    expect(inMatch.number).toBe(12)
    expect(inMatch.mainPosition).toBe('opposite')
    expect(inMatch.otherPositions).toEqual(['outside'])
  })
})
