// Volleyball court geometry, the expected role per zone for each game system, and how
// those roles move when the team rotates (R1, R2…).
import type { GameSystem, Position } from '@/shared/domain/types'

export type Zone = 1 | 2 | 3 | 4 | 5 | 6

/** Court layout as seen from behind the baseline: front row (net side) first. */
export const COURT_ROWS: Zone[][] = [
  [4, 3, 2],
  [5, 6, 1],
]

export const SYSTEMS: GameSystem[] = ['5-1', '6-0', '4-2', '6-2', '4-2-front']

/**
 * Starting template of each system: expected role per zone before any rotation.
 * Every other rotation is derived from it. The coach can still place anyone with "mostrar todos".
 */
const TEMPLATE_ZONE_ROLES: Record<GameSystem, Record<Zone, Position>> = {
  '5-1': { 1: 'setter', 2: 'outside', 3: 'middle', 4: 'opposite', 5: 'outside', 6: 'middle' },
  '6-0': { 1: 'outside', 2: 'outside', 3: 'outside', 4: 'outside', 5: 'outside', 6: 'outside' },
  '4-2': { 1: 'setter', 2: 'outside', 3: 'middle', 4: 'setter', 5: 'outside', 6: 'middle' },
  '6-2': { 1: 'setter', 2: 'outside', 3: 'middle', 4: 'setter', 5: 'outside', 6: 'middle' },
  '4-2-front': { 1: 'outside', 2: 'middle', 3: 'setter', 4: 'outside', 5: 'middle', 6: 'setter' },
}

/**
 * Order players follow when the team rotates: whoever is in zone 2 moves to 1, from 1 to 6,
 * from 6 to 5, and so on. Each step is one rotation; the setter goes 1 → 6 → 5 → 4 → 3 → 2.
 */
const ROTATION_ORDER: Zone[] = [1, 6, 5, 4, 3, 2]

/** Zone a player ends up in after rotating `steps` times (negative steps rotate backwards). */
function rotateZone(zone: Zone, steps: number): Zone {
  const index = ROTATION_ORDER.indexOf(zone)
  return ROTATION_ORDER[(((index + steps) % 6) + 6) % 6]
}

/** Role per zone after the team has rotated `steps` times from the template. */
function rolesAfterSteps(system: GameSystem, steps: number): Record<Zone, Position> {
  const roles = {} as Record<Zone, Position>
  for (const zone of ROTATION_ORDER) {
    // The role now in `zone` is the one that was in this earlier zone in the template.
    roles[zone] = TEMPLATE_ZONE_ROLES[system][rotateZone(zone, -steps)]
  }
  return roles
}

const FRONT_ROW: Zone[] = [2, 3, 4]

/**
 * Which setter names the rotation when there are two: in a 4-2 the front-row setter sets,
 * in a 6-2 the back-row one. `null` means the system has no setter (6-0) and no R.
 */
const SETTING_ROW: Record<GameSystem, 'front' | 'back' | 'any' | null> = {
  '5-1': 'any',
  '6-0': null,
  '4-2': 'front',
  '6-2': 'back',
  '4-2-front': 'front',
}

/** Zone of the setting setter after `steps` rotations: that zone is the R number. */
function settingSetterZone(system: GameSystem, steps: number): Zone | undefined {
  const row = SETTING_ROW[system]
  const roles = rolesAfterSteps(system, steps)
  return ROTATION_ORDER.find(
    (zone) =>
      roles[zone] === 'setter' &&
      (row === 'any' || (row === 'front') === FRONT_ROW.includes(zone)),
  )
}

/**
 * Rotations available in a system, named after the zone of the setter who sets:
 * R1–R6 in a 5-1, R2–R4 in a 4-2, R1/R5/R6 in a 6-2, none in a 6-0.
 */
export function availableRotations(system: GameSystem): number[] {
  if (SETTING_ROW[system] === null) return []
  const zones = new Set<number>()
  for (let steps = 0; steps < 6; steps++) {
    const zone = settingSetterZone(system, steps)
    if (zone) zones.add(zone)
  }
  return [...zones].sort((a, b) => a - b)
}

/** Rotations needed to go from the template to rotation R`rotationNumber` (0 if it does not exist). */
function stepsTo(system: GameSystem, rotationNumber: number): number {
  for (let steps = 0; steps < 6; steps++) {
    if (settingSetterZone(system, steps) === rotationNumber) return steps
  }
  return 0
}

/** Expected role per zone when the set starts in rotation R`rotationNumber`. */
export function zoneRoles(system: GameSystem, rotationNumber: number): Record<Zone, Position> {
  return rolesAfterSteps(system, stepsTo(system, rotationNumber))
}

/**
 * Moves every placed player from rotation R`from` to R`to`, so each one keeps the role
 * they were placed in.
 */
export function rotatePlayers(
  system: GameSystem,
  rotation: Partial<Record<Zone, string>>,
  from: number,
  to: number,
): Partial<Record<Zone, string>> {
  const steps = stepsTo(system, to) - stepsTo(system, from)
  const rotated: Partial<Record<Zone, string>> = {}
  for (const zone of ROTATION_ORDER) {
    const playerId = rotation[zone]
    if (playerId) rotated[rotateZone(zone, steps)] = playerId
  }
  return rotated
}
