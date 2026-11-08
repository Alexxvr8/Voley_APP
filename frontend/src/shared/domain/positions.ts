// Converts between a player's positions as stored (main + others) and the ordered list the position
// checklist edits, where the first checked position is the main one (no React here).
import type { Position } from './types'

/** Ordered list for the checklist: the main position first, then the others. */
export function toPositionList(main: Position, others: Position[]): Position[] {
  return [main, ...others.filter((position) => position !== main)]
}

/** Main and other positions from the checklist; null while nothing is checked. */
export function fromPositionList(
  list: Position[],
): { mainPosition: Position; otherPositions: Position[] } | null {
  const [main, ...others] = list
  return main ? { mainPosition: main, otherPositions: others.filter((p) => p !== main) } : null
}

/** Checks a position (added at the end) or unchecks it. */
export function togglePosition(list: Position[], position: Position): Position[] {
  return list.includes(position) ? list.filter((p) => p !== position) : [...list, position]
}
