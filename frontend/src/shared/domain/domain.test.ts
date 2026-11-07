// Tests for match results and per-match call-up positions.
import { describe, expect, it } from 'vitest'
import { asCalledUp } from './callups'
import { resultSummary, setsDetail, setsWon } from './results'
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
    expect(resultSummary(sets)).toBe('Ganado 3-1')
    expect(resultSummary([])).toBe('')
    expect(setsDetail(sets.slice(0, 2))).toBe('25-20 · 23-25')
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
