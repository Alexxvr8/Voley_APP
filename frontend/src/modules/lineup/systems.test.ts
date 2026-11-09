// Tests for the rotations of each system and how the lineup moves between them.
import { describe, expect, it } from 'vitest'
import { availableRotations, rotatePlayers, zoneRoles } from './systems'

describe('availableRotations', () => {
  it('matches the spec: R1–R6 in 5-1, R2–R4 in 4-2, R1/R5/R6 in 6-2, none in 6-0', () => {
    expect(availableRotations('5-1')).toEqual([1, 2, 3, 4, 5, 6])
    expect(availableRotations('4-2')).toEqual([2, 3, 4])
    expect(availableRotations('6-2')).toEqual([1, 5, 6])
    expect(availableRotations('6-0')).toEqual([])
  })
})

describe('zoneRoles', () => {
  it('puts the setter in the zone that names the rotation (5-1)', () => {
    for (const r of [1, 2, 3, 4, 5, 6]) expect(zoneRoles('5-1', r)[r as 1]).toBe('setter')
  })
})

describe('rotatePlayers', () => {
  it('keeps every player on the role they were placed in', () => {
    const lineup = { 1: 'setter-id', 3: 'middle-id' } as const
    const rotated = rotatePlayers('5-1', lineup, 1, 4)
    const roles = zoneRoles('5-1', 4)
    const zoneOf = (id: string) =>
      Number(Object.entries(rotated).find(([, p]) => p === id)?.[0]) as 1
    expect(roles[zoneOf('setter-id')]).toBe('setter')
    expect(roles[zoneOf('middle-id')]).toBe('middle')
  })
})
