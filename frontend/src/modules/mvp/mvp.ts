// Pure rules of the MVP module: vote state, picking 1 or 2 players, time left and season ranking.
import type { Match, Player } from '@/shared/domain/types'
import { playerName } from '@/shared/utils/format'

/** Most players a voter can pick. */
export const MAX_PICKS = 2

/** What a screen shows for a match's vote, including an open vote whose 48 h are already over. */
export type VotePhase = 'none' | 'open' | 'expired' | 'tie' | 'finished'

export function votePhase(match: Match, now: Date): VotePhase {
  switch (match.mvpStatus) {
    case 'open':
      return match.mvpClosesAt && new Date(match.mvpClosesAt) <= now ? 'expired' : 'open'
    case 'tie_pending':
      return 'tie'
    case 'finished':
      return 'finished'
    default:
      return 'none'
  }
}

/**
 * Toggles a player in the current pick. When the pick is already full, the oldest choice is
 * dropped, so a single tap always changes the selection.
 */
export function togglePick(picked: string[], playerId: string, max = MAX_PICKS): string[] {
  if (picked.includes(playerId)) return picked.filter((id) => id !== playerId)
  return [...picked, playerId].slice(-max)
}

/** Same players regardless of order (to know whether the vote changed). */
export function samePick(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id))
}

/** "Cierra en 23 h", "Cierra en 40 min" or "Cierra en menos de 1 min". */
export function closesInLabel(closesAt: string, now: Date): string {
  const minutes = Math.floor((new Date(closesAt).getTime() - now.getTime()) / 60_000)
  if (minutes < 1) return 'Cierra en menos de 1 min'
  if (minutes < 60) return `Cierra en ${minutes} min`
  return `Cierra en ${Math.floor(minutes / 60)} h`
}

export interface RankingEntry {
  player: Player
  /** MVPs won this season (a co-MVP counts one for each). */
  wins: number
}

/**
 * Season ranking from the finished votes, most wins first (ties by name). With `includeZeros`
 * (coach view) every competing player still in the team is listed; otherwise only those with at
 * least one MVP. Pass the matches of one season.
 */
export function seasonRanking(
  matches: Match[],
  players: Player[],
  includeZeros: boolean,
): RankingEntry[] {
  const wins = new Map<string, number>()
  for (const match of matches) {
    if (match.mvpStatus !== 'finished') continue
    for (const id of match.mvpWinners) wins.set(id, (wins.get(id) ?? 0) + 1)
  }
  return players
    .filter((player) =>
      includeZeros
        ? (player.competes && player.active) || wins.has(player.id)
        : wins.has(player.id),
    )
    .map((player) => ({ player, wins: wins.get(player.id) ?? 0 }))
    .sort(
      (a, b) => b.wins - a.wins || playerName(a.player).localeCompare(playerName(b.player), 'es'),
    )
}

/** Players with the most votes (several when tied at the top; empty without votes). */
export function topVoted(votes: { playerId: string; votes: number }[]): string[] {
  const max = Math.max(0, ...votes.map((entry) => entry.votes))
  return max === 0
    ? []
    : votes.filter((entry) => entry.votes === max).map((entry) => entry.playerId)
}
