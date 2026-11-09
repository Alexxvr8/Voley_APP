// Data shape of a per-set plan and the pure helpers that work on it (no React here).
// Mirrors the `set_plans` table described in backend/README.md.
import type { GameSystem, Player, Position } from '@/shared/domain/types'
import { availableRotations, zoneRoles, type Zone } from './systems'

/** One player for another: `outId` leaves the court, `inId` comes into their zone. */
export interface SubSwap {
  outId: string
  inId: string
}

/**
 * Kind of planned change:
 * - `normal`: one player for another, done once. The incoming player covers the zone's role (a
 *   receiver can come in for a middle in the back row); the rotation does not change.
 * - `serve`: X → Y to serve, then "Vuelve": Y → X when the team loses the serve.
 * - `double`: double switch, setter ↔ opposite at once (two swaps). The incoming setter takes over
 *   in the opposite's zone, so the rotation jumps three places (R4 → R1). It can be undone later.
 */
export type SubKind = 'normal' | 'serve' | 'double'

/** A group of substitutions the coach plans in advance (spec module 5). */
export interface PlannedSub {
  kind: SubKind
  /** One swap, or two for a double switch (setter out first, then opposite out). */
  swaps: SubSwap[]
  /** Optional reminder, e.g. "si falla recepción" or "en R4". */
  note: string
}

/** Steps of each kind in the match mode: do it, and for `serve` / `double` also go back. */
export const SUB_STEP_COUNT: Record<SubKind, number> = { normal: 1, serve: 2, double: 2 }

/** Up to two liberos per set; either slot can be empty. */
export type LiberoSlots = [string | undefined, string | undefined]

/** Everything the coach decides for one set (spec module 5). */
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
 * or the team default for the first set (spec module 5).
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

/** Keeps the start rotation if the system has it, otherwise falls back to its first one. */
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

/** Bench players for a zone of `role`: those who can play it first (by number), then the rest. */
export function substitutesByFit(bench: Player[], role: Position): Player[] {
  const fits = bench.filter((player) => canPlay(player, role))
  return [...fits, ...bench.filter((player) => !canPlay(player, role))]
}

/**
 * The setter and opposite of the starting lineup, for a double switch. Null when the system has no
 * opposite (6-0, 4-2, 6-2) or those zones are still empty.
 */
export function doubleSwitchPair(plan: SetPlan): { setterId: string; oppositeId: string } | null {
  const roles = zoneRoles(plan.system, plan.startRotation)
  const zoneOf = (role: Position) =>
    (Object.keys(roles).map(Number) as Zone[]).find((zone) => roles[zone] === role)
  const setterZone = zoneOf('setter')
  const oppositeZone = zoneOf('opposite')
  const setterId = setterZone && plan.rotation[setterZone]
  const oppositeId = oppositeZone && plan.rotation[oppositeZone]
  return setterId && oppositeId ? { setterId, oppositeId } : null
}

/**
 * The plan with another system. Players stay in their zones and the start rotation is chosen so a
 * setter player stands in a setter zone, preferring the one who was setting (5-1 R1 → 4-2 R4,
 * 6-0 → 5-1 with the setter where she is…). A 6-0 has no rotations: the old one is kept for later.
 */
export function withSystem(plan: SetPlan, system: GameSystem, players: Player[]): SetPlan {
  const rotations = availableRotations(system)
  if (rotations.length === 0) return { ...plan, system }
  const playerIn = (zone: Zone) => players.find((player) => player.id === plan.rotation[zone])
  const oldRoles = zoneRoles(plan.system, plan.startRotation)
  const zones = [1, 2, 3, 4, 5, 6] as Zone[]
  // Zones to keep a setter in, best first: the setting setter, other setters on court, then the
  // zone that named the old rotation (no players placed yet).
  const isSetterPlayer = (zone: Zone) => playerIn(zone)?.mainPosition === 'setter'
  const preferred = [
    ...zones.filter((zone) => zone === plan.startRotation && isSetterPlayer(zone)),
    ...zones.filter((zone) => zone !== plan.startRotation && isSetterPlayer(zone)),
    ...zones.filter((zone) => zone === plan.startRotation && oldRoles[zone] === 'setter'),
  ]
  for (const zone of preferred) {
    const fitting = rotations.find((r) => zoneRoles(system, r)[zone] === 'setter')
    if (fitting) return { ...plan, system, startRotation: fitting }
  }
  return { ...plan, system, startRotation: validStartRotation(system, plan.startRotation) }
}

/** Whether the system has an opposite, i.e. allows the setter ↔ opposite double switch (5-1). */
export function hasOpposite(system: GameSystem): boolean {
  return Object.values(zoneRoles(system, availableRotations(system)[0] ?? 1)).includes('opposite')
}

/**
 * Whether a player fits a zone's role. In a 6-0 every zone is the same, so anyone fits.
 */
export function fitsZone(system: GameSystem, player: Player, role: Position): boolean {
  return system === '6-0' || canPlay(player, role)
}
