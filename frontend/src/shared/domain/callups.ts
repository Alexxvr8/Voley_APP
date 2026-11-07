// Applies a call-up's per-match number and positions to a roster entry (no React here).
import type { Callup, Player, Position } from './types'

/** The player as they play this match: the call-up's number and positions replace the roster ones. */
export function asCalledUp(player: Player, callup: Callup): Player {
  const number = callup.number ?? player.number
  if (!callup.positions?.length) return { ...player, number }
  const [mainPosition, ...otherPositions] = callup.positions
  return { ...player, number, mainPosition, otherPositions }
}

/** All the positions a roster entry can play, main one first. */
export function rosterPositions(player: Player): Position[] {
  return [player.mainPosition, ...player.otherPositions]
}

export interface CallupRow {
  player_id: string
  number: number | null
  positions: string[] | null
}

export function toCallup(row: CallupRow): Callup {
  return {
    playerId: row.player_id,
    number: row.number,
    positions: row.positions as Position[] | null,
  }
}
