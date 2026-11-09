// Order of the Gestión list: called-up players first, by the position they play in this match
// (setter, outside, middle, opposite, libero) and number; then everyone else by number.
import { asCalledUp } from '@/shared/domain/callups'
import { POSITIONS } from '@/shared/domain/labels'
import type { Callup, Player } from '@/shared/domain/types'
import { byShirtNumber } from '@/shared/utils/format'

export interface CallupListEntry {
  /** The roster entry as it is. */
  rosterPlayer: Player
  /** With this match's number and positions when called up. */
  player: Player
  callup: Callup | undefined
}

export function orderCallupList(players: Player[], callups: Callup[]): CallupListEntry[] {
  const entries = players.map((rosterPlayer) => {
    const callup = callups.find((entry) => entry.playerId === rosterPlayer.id)
    return {
      rosterPlayer,
      player: callup ? asCalledUp(rosterPlayer, callup) : rosterPlayer,
      callup,
    }
  })
  const calledUp = entries
    .filter((entry) => entry.callup)
    .sort(
      (a, b) =>
        POSITIONS.indexOf(a.player.mainPosition) - POSITIONS.indexOf(b.player.mainPosition) ||
        byShirtNumber(a.player, b.player),
    )
  const others = entries
    .filter((entry) => !entry.callup)
    .sort((a, b) => byShirtNumber(a.player, b.player))
  return [...calledUp, ...others]
}
