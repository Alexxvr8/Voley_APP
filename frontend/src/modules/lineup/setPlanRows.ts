// Converts a set plan between the editor's shape and the `set_plans` table / `save_set_plan()` RPC
// (no React here).
import type { GameSystem } from '@/shared/domain/types'
import type { PlannedSub, SetPlan, SubKind } from './setPlan'
import type { Zone } from './systems'

/** A plan as stored on the server, with the version it was saved as. */
export interface StoredSetPlan {
  plan: SetPlan
  /** Server version (`updated_at`); null for a set only edited on this device so far. */
  updatedAt: string | null
}

/** Plans of a match by set number. */
export type StoredSetPlans = Partial<Record<number, StoredSetPlan>>

/** A planned change as saved: `{kind, swaps, note}`; older rows saved `{out, in, note}`. */
type StoredSub =
  | { kind: SubKind; swaps: { out: string; in: string }[]; note: string }
  | { out: string; in: string; note: string }

function toPlannedSub(stored: StoredSub): PlannedSub {
  if ('swaps' in stored) {
    return {
      kind: stored.kind,
      swaps: stored.swaps.map((swap) => ({ outId: swap.out, inId: swap.in })),
      note: stored.note,
    }
  }
  return { kind: 'normal', swaps: [{ outId: stored.out, inId: stored.in }], note: stored.note }
}

export interface SetPlanRow {
  set_number: number
  system: string
  start_rotation: number
  rotation: Record<string, string>
  libero_id: string | null
  second_libero_id: string | null
  planned_subs: StoredSub[]
  updated_at: string
}

export function toStoredSetPlan(row: SetPlanRow): StoredSetPlan {
  const rotation: Partial<Record<Zone, string>> = {}
  for (const [zone, playerId] of Object.entries(row.rotation)) {
    if (playerId) rotation[Number(zone) as Zone] = playerId
  }
  return {
    plan: {
      system: row.system as GameSystem,
      startRotation: row.start_rotation,
      rotation,
      liberos: [row.libero_id ?? undefined, row.second_libero_id ?? undefined],
      subs: (row.planned_subs ?? []).map(toPlannedSub),
    },
    updatedAt: row.updated_at,
  }
}

/** Arguments of `save_set_plan()` for one set. */
export function toSaveArgs(
  matchId: string,
  setNumber: number,
  plan: SetPlan,
  baseUpdatedAt: string | null,
) {
  return {
    match: matchId,
    set_number: setNumber,
    system: plan.system,
    start_rotation: plan.startRotation,
    rotation: Object.fromEntries(Object.entries(plan.rotation).filter(([, id]) => id)),
    libero_id: plan.liberos[0] ?? null,
    second_libero_id: plan.liberos[1] ?? null,
    planned_subs: plan.subs.map((sub) => ({
      kind: sub.kind,
      swaps: sub.swaps.map((swap) => ({ out: swap.outId, in: swap.inId })),
      note: sub.note,
    })),
    base_updated_at: baseUpdatedAt,
  }
}
