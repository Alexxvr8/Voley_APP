// Applies a call-up's per-match number and position to a roster entry (no React here).
import type { Callup, Player } from './types'

/** The player as they play this match: the call-up's number and position replace the roster ones. */
export function asCalledUp(player: Player, callup: Callup): Player {
  if (!callup.position) return { ...player, number: callup.number ?? player.number }
  return {
    ...player,
    number: callup.number ?? player.number,
    mainPosition: callup.position,
    // The roster position stays available as a secondary one.
    otherPositions: [player.mainPosition, ...player.otherPositions].filter(
      (position) => position !== callup.position,
    ),
  }
}

export interface CallupRow {
  player_id: string
  number: number | null
  position: string | null
}

export function toCallup(row: CallupRow): Callup {
  return {
    playerId: row.player_id,
    number: row.number,
    position: row.position as Callup['position'],
  }
}
