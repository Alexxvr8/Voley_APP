// Data shape of a per-set plan and the pure helpers that work on it (no React here).
// Mirrors the `set_plans` table described in backend/README.md.
import type { GameSystem, Player } from '@/shared/domain/types'
import type { Zone } from './systems'

/** Sets in a match: best of five. */
export const SET_NUMBERS = [1, 2, 3, 4, 5] as const

/** A substitution the coach plans in advance: `outId` leaves the court, `inId` comes in. */
export interface PlannedSub {
  outId: string
  inId: string
  /** Optional reminder, e.g. "si falla recepción" or "en rotación 3". */
  note: string
}

/** Everything the coach decides for one set (SPEC module 5). */
export interface SetPlan {
  system: GameSystem
  /** Starting rotation (R1): which player stands in each zone. Zones may still be empty. */
  rotation: Partial<Record<Zone, string>>
  liberoId?: string
  /** Player the libero replaces when they come in. */
  liberoReplacesId?: string
  subs: PlannedSub[]
}

/** Plans of a match indexed by set number. Sets without a plan are simply missing. */
export type SetPlans = Partial<Record<number, SetPlan>>

/**
 * Plan shown for a set that has not been edited yet: it inherits the previous set's system,
 * or the team default for the first set (SPEC module 5).
 */
export function newSetPlan(previous: SetPlan | undefined, defaultSystem: GameSystem): SetPlan {
  return { system: previous?.system ?? defaultSystem, rotation: {}, subs: [] }
}

/** Ids of the six players placed on the court. */
export function playersOnCourt(plan: SetPlan): string[] {
  return Object.values(plan.rotation).filter((id): id is string => id !== undefined)
}

/** True if the player can play the position, either as main or secondary position. */
export function canPlay(player: Player, position: Player['mainPosition']): boolean {
  return player.mainPosition === position || player.otherPositions.includes(position)
}
