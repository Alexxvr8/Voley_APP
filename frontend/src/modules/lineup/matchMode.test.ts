// Tests for the match mode: rotating the lineup, the R shown and substitutions on court.
import { describe, expect, it } from 'vitest'
import { advanceSub, liveLineup, NO_PROGRESS, readProgress, roleSteps, undoSub } from './matchMode'
import type { SetPlan } from './setPlan'
import { advanceLineup, rotationAfter, zoneRolesAfter } from './systems'

const plan: SetPlan = {
  system: '5-1',
  startRotation: 1,
  rotation: { 1: 'setter', 2: 'outside', 3: 'middle', 4: 'opposite', 5: 'outside2', 6: 'middle2' },
  liberos: [undefined, undefined],
  subs: [
    { kind: 'normal', swaps: [{ outId: 'middle2', inId: 'bench-outside' }], note: '' },
    { kind: 'serve', swaps: [{ outId: 'outside', inId: 'server' }], note: '' },
    {
      kind: 'double',
      swaps: [
        { outId: 'setter', inId: 'bench-opposite' },
        { outId: 'opposite', inId: 'bench-setter' },
      ],
      note: 'en R4',
    },
  ],
}

const zoneOf = (lineup: Record<number, string | undefined>, id: string) =>
  Number(Object.entries(lineup).find(([, playerId]) => playerId === id)?.[0])

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
    expect(roles[zoneOf(lineup, 'setter') as 1]).toBe('setter')
  })
})

describe('planned changes in the match mode', () => {
  it('does a normal change and undoes it', () => {
    const done = advanceSub(NO_PROGRESS, plan, 0)
    expect(Object.values(liveLineup(plan, done))).toContain('bench-outside')
    expect(liveLineup(plan, undoSub(done, 0))).toEqual(plan.rotation)
    expect(advanceSub(done, plan, 0)).toEqual(done)
  })

  it('puts the server in and takes them back with "Vuelve"', () => {
    const serving = advanceSub(NO_PROGRESS, plan, 1)
    expect(zoneOf(liveLineup(plan, serving), 'server')).toBe(2)
    const back = advanceSub(serving, plan, 1)
    expect(liveLineup(plan, back)).toEqual(plan.rotation)
  })

  it('turns R4 into R1 with the double switch, and back with its second step', () => {
    const inR4 = { steps: 3, subSteps: {} }
    expect(rotationAfter('5-1', 1, roleSteps(plan, inR4))).toBe(4)
    const switched = advanceSub(inR4, plan, 2)
    expect(rotationAfter('5-1', 1, roleSteps(plan, switched))).toBe(1)
    // The incoming setter stands where the opposite was, which is now the setter's zone.
    const lineup = liveLineup(plan, switched)
    const roles = zoneRolesAfter('5-1', 1, roleSteps(plan, switched))
    expect(roles[zoneOf(lineup, 'bench-setter') as 1]).toBe('setter')
    expect(roles[zoneOf(lineup, 'bench-opposite') as 1]).toBe('opposite')
    const back = advanceSub(switched, plan, 2)
    expect(rotationAfter('5-1', 1, roleSteps(plan, back))).toBe(4)
  })

  it('reads progress saved by older versions', () => {
    expect(readProgress({ steps: 2, subsDone: [0] })).toEqual({ steps: 2, subSteps: { 0: 1 } })
    expect(readProgress(undefined)).toEqual(NO_PROGRESS)
  })
})
