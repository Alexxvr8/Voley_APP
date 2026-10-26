import type { GameSystem, Position } from '@/shared/domain/types'

export type Zone = 1 | 2 | 3 | 4 | 5 | 6

/** Court layout as seen from behind the baseline: front row (net side) first. */
export const COURT_ROWS: Zone[][] = [
  [4, 3, 2],
  [5, 6, 1],
]

export const SYSTEMS: GameSystem[] = ['5-1', '6-0', '4-2', '6-2', '4-2-front']

/**
 * Expected role per zone in the starting rotation (R1) for each system.
 * Initial templates; the coach can still place anyone with "mostrar todos".
 */
export const ZONE_ROLES: Record<GameSystem, Record<Zone, Position>> = {
  '5-1': { 1: 'setter', 2: 'outside', 3: 'middle', 4: 'opposite', 5: 'outside', 6: 'middle' },
  '6-0': { 1: 'outside', 2: 'outside', 3: 'middle', 4: 'outside', 5: 'outside', 6: 'middle' },
  '4-2': { 1: 'setter', 2: 'outside', 3: 'middle', 4: 'setter', 5: 'outside', 6: 'middle' },
  '6-2': { 1: 'setter', 2: 'outside', 3: 'middle', 4: 'setter', 5: 'outside', 6: 'middle' },
  '4-2-front': { 1: 'outside', 2: 'middle', 3: 'setter', 4: 'outside', 5: 'middle', 6: 'setter' },
}
