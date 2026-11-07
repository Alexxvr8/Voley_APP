// Tests for the match mode: rotating the lineup, the R shown and substitutions on court.
import { describe, expect, it } from 'vitest'
import { liveLineup, toggleSub } from './matchMode'
import type { SetPlan } from './setPlan'
import { advanceLineup, rotationAfter, zoneRolesAfter } from './systems'

const plan: SetPlan = {
  system: '5-1',
  startRotation: 1,
  rotation: { 1: 'setter', 2: 'outside', 3: 'middle', 4: 'opposite', 5: 'outside2', 6: 'middle2' },
  liberos: [undefined, undefined],
  subs: [{ outId: 'opposite', inId: 'bench', note: '' }],
}

describe('rotations', () => {
  it('moves players 2 → 1, 1 → 6 …', () => {
    expect(advanceLineup({ 2: 'a', 1: 'b' }, 1)).toEqual({ 1: 'a', 6: 'b' })
    expect(advanceLineup({ 1: 'a' }, 6)).toEqual({ 1: 'a' })
  })

  it('names the rotation after the setter zone: R1 → R6 → R5 … in a 5-1', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((steps) => rotationAfter('5-1', 1, steps))).toEqual([
      1, 6, 5, 4, 3, 2, 1,
    ])
    expect(rotationAfter('6-0', 1, 2)).toBeNull()
  })

  it('keeps the setter role where the setter player is', () => {
    const lineup = advanceLineup(plan.rotation, 2)
    const roles = zoneRolesAfter('5-1', 1, 2)
    const setterZone = Number(Object.entries(lineup).find(([, id]) => id === 'setter')![0]) as 1
    expect(roles[setterZone]).toBe('setter')
  })
})

describe('liveLineup', () => {
  it('applies the substitutions done, after rotating', () => {
    const progress = toggleSub({ steps: 1, subsDone: [] }, 0)
    const lineup = liveLineup(plan, progress)
    expect(Object.values(lineup)).toContain('bench')
    expect(Object.values(lineup)).not.toContain('opposite')
    expect(liveLineup(plan, toggleSub(progress, 0))).toEqual(advanceLineup(plan.rotation, 1))
  })
})
