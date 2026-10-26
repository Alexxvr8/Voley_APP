// Data shape of a per-set plan and the pure helpers that work on it (no React here).
// Mirrors the `set_plans` table described in backend/README.md.
import type { GameSystem, Player, Position } from '@/shared/domain/types'
import { availableRotations, zoneRoles, type Zone } from './systems'

/** Sets in a match: best of five. */
export const SET_NUMBERS = [1, 2, 3, 4, 5] as const

/** A substitution the coach plans in advance: `outId` leaves the court, `inId` comes in. */
export interface PlannedSub {
  outId: string
  inId: string
  /** Optional reminder, e.g. "si falla recepción" or "en rotación 3". */
  note: string
}

/** Up to two liberos per set; either slot can be empty. */
export type LiberoSlots = [string | undefined, string | undefined]

/** Everything the coach decides for one set (SPEC module 5). */
export interface SetPlan {
  system: GameSystem
  /** Rotation the set starts in, named by the setter's zone (4 = R4). One of `availableRotations(system)`. */
  startRotation: number
  /** Starting lineup: which player stands in each zone. Zones may still be empty. */
  rotation: Partial<Record<Zone, string>>
  liberos: LiberoSlots
  subs: PlannedSub[]
}

/** Plans of a match indexed by set number. Sets without a plan are simply missing. */
export type SetPlans = Partial<Record<number, SetPlan>>

/**
 * Plan shown for a set that has not been edited yet: it inherits the previous set's system,
 * or the team default for the first set (SPEC module 5).
 */
export function newSetPlan(previous: SetPlan | undefined, defaultSystem: GameSystem): SetPlan {
  const system = previous?.system ?? defaultSystem
  return {
    system,
    startRotation: validStartRotation(system, 1),
    rotation: {},
    liberos: [undefined, undefined],
    subs: [],
  }
}

/** Ids of the players placed on the court. */
export function playersOnCourt(plan: SetPlan): string[] {
  return Object.values(plan.rotation).filter((id): id is string => id !== undefined)
}

/** Ids of the liberos chosen for the set. */
export function chosenLiberos(plan: SetPlan): string[] {
  return plan.liberos.filter((id): id is string => id !== undefined)
}

/** Keeps the start rotation if the system has it, otherwise falls back to its first one (e.g. 5-1 R1 → 4-2 R2). */
export function validStartRotation(system: GameSystem, startRotation: number): number {
  const rotations = availableRotations(system)
  return rotations.includes(startRotation) ? startRotation : (rotations[0] ?? 1)
}

/** Role a player covers in the starting lineup, from the zone they are placed in. */
export function roleOnCourt(plan: SetPlan, playerId: string): Position | undefined {
  const roles = zoneRoles(plan.system, plan.startRotation)
  const placement = Object.entries(plan.rotation).find(([, id]) => id === playerId)
  return placement ? roles[Number(placement[0]) as Zone] : undefined
}

/** True if the player can play the position, either as main or secondary position. */
export function canPlay(player: Player, position: Position): boolean {
  return player.mainPosition === position || player.otherPositions.includes(position)
}

/**
 * Positions that may come in for a player covering `role`: the same one, plus setter ↔ opposite,
 * the double switch coaches use to jump from one rotation to another.
 */
export function replacementPositions(role: Position): Position[] {
  if (role === 'setter') return ['setter', 'opposite']
  if (role === 'opposite') return ['opposite', 'setter']
  return [role]
}
