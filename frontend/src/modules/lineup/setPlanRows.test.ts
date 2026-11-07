// Round trip between the editor's set plan and what is saved on the server.
import { describe, expect, it } from 'vitest'
import type { SetPlan } from './setPlan'
import { toSaveArgs, toStoredSetPlan } from './setPlanRows'

const plan: SetPlan = {
  system: '5-1',
  startRotation: 4,
  rotation: { 1: 'a', 4: 'b' },
  liberos: ['l1', undefined],
  subs: [{ outId: 'b', inId: 'c', note: 'si falla recepción' }],
}

describe('set plan rows', () => {
  it('survives a save and load', () => {
    const args = toSaveArgs('m', 2, plan, null)
    expect(args.libero_id).toBe('l1')
    expect(args.second_libero_id).toBeNull()
    const row = {
      set_number: 2,
      system: args.system,
      start_rotation: args.start_rotation,
      rotation: args.rotation,
      libero_id: args.libero_id,
      second_libero_id: args.second_libero_id,
      planned_subs: args.planned_subs,
      updated_at: '2026-11-08T10:00:00Z',
    }
    expect(toStoredSetPlan(row)).toEqual({ plan, updatedAt: '2026-11-08T10:00:00Z' })
  })
})
