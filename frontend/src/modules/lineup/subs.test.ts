// Tests of the planned substitution groups: who can come in and the double switch pair.
import { describe, expect, it } from 'vitest'
import type { Player, Position } from '@/shared/domain/types'
import {
  doubleSwitchPair,
  fitsZone,
  hasOpposite,
  substitutesByFit,
  withSystem,
  type SetPlan,
} from './setPlan'
import { zoneRoles } from './systems'

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

describe('withSystem', () => {
  const players = [
    player('setter', 'setter'),
    player('opposite', 'opposite'),
    player('middle', 'middle'),
  ]
  const plan: SetPlan = {
    system: '5-1',
    startRotation: 1,
    rotation: { 1: 'setter', 4: 'opposite', 3: 'middle' },
    liberos: [undefined, undefined],
    subs: [],
  }
  const setterRole = (p: SetPlan) => zoneRoles(p.system, p.startRotation)[1]

  it('keeps the setter player in a setter zone, without moving players', () => {
    const fourTwo = withSystem(plan, '4-2', players)
    expect(fourTwo.startRotation).toBe(4)
    expect(setterRole(fourTwo)).toBe('setter')
    expect(fourTwo.rotation).toEqual(plan.rotation)
    expect(setterRole(withSystem(plan, '6-2', players))).toBe('setter')
  })

  it('looks at the players, not the drawing: from 4-2 R4 back to 5-1 the setter sets in R1', () => {
    const fromFourTwo = withSystem({ ...plan, system: '4-2', startRotation: 4 }, '5-1', players)
    expect(fromFourTwo.startRotation).toBe(1)
  })

  it('survives a trip through 6-0 (which has no setter)', () => {
    const sixZero = withSystem({ ...plan, startRotation: 1 }, '6-0', players)
    expect(sixZero.system).toBe('6-0')
    expect(withSystem(sixZero, '4-2', players).startRotation).toBe(4)
    expect(withSystem(sixZero, '5-1', players).startRotation).toBe(1)
  })

  it('uses the old rotation when nobody is placed yet', () => {
    const empty = { ...plan, startRotation: 3, rotation: {} }
    expect(withSystem(empty, '4-2', []).startRotation).toBe(3)
  })
})

describe('fitsZone and hasOpposite', () => {
  it('lets anyone play any zone in a 6-0 and only 5-1 has an opposite', () => {
    expect(fitsZone('6-0', player('m', 'middle'), 'outside')).toBe(true)
    expect(fitsZone('5-1', player('m', 'middle'), 'outside')).toBe(false)
    expect(hasOpposite('5-1')).toBe(true)
    expect(['6-0', '4-2', '6-2'].map((s) => hasOpposite(s as '6-0'))).toEqual([false, false, false])
  })
})
