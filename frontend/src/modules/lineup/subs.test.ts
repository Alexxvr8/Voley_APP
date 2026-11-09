// Tests of the planned substitution groups: who can come in and the double switch pair.
import { describe, expect, it } from 'vitest'
import type { Player, Position } from '@/shared/domain/types'
import { doubleSwitchPair, substitutesByFit, type SetPlan } from './setPlan'

function player(id: string, mainPosition: Position, otherPositions: Position[] = []): Player {
  return {
    id,
    firstName: id,
    lastName: '',
    nickname: '',
    birthYear: null,
    number: null,
    mainPosition,
    otherPositions,
    competes: true,
    active: true,
    membership: 'member',
    visitWeekdays: [],
    visitDate: null,
  }
}

describe('substitutesByFit', () => {
  it('offers who can play the role first, and the rest after (a receiver for a middle)', () => {
    const bench = [
      player('outside', 'outside'),
      player('middle', 'middle'),
      player('both', 'outside', ['middle']),
    ]
    expect(substitutesByFit(bench, 'middle').map((p) => p.id)).toEqual([
      'middle',
      'both',
      'outside',
    ])
  })
})

describe('doubleSwitchPair', () => {
  const base: SetPlan = {
    system: '5-1',
    startRotation: 4,
    rotation: { 4: 'setter', 1: 'opposite', 2: 'outside' },
    liberos: [undefined, undefined],
    subs: [],
  }

  it('finds the setter and opposite of the starting lineup in a 5-1', () => {
    expect(doubleSwitchPair(base)).toEqual({ setterId: 'setter', oppositeId: 'opposite' })
  })

  it('is null without an opposite or with empty zones', () => {
    expect(doubleSwitchPair({ ...base, system: '4-2', startRotation: 2 })).toBeNull()
    expect(doubleSwitchPair({ ...base, rotation: { 4: 'setter' } })).toBeNull()
  })
})
