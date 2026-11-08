// Guesses which roster entry without account belongs to a player who just joined, comparing names
// without accents or case (no React here).
import type { Player } from '@/shared/domain/types'
import type { Member } from './members'

/** Lowercase words without accents: "José  Ángel" → ["jose", "angel"]. */
export function nameWords(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9ñ]+/)
    .filter(Boolean)
}

/** How well a roster entry matches the member: 2 = first and last name, 1 = first name only. */
function matchScore(member: Member, player: Player): number {
  const words = new Set([...nameWords(member.displayName), ...nameWords(member.username)])
  const first = nameWords(player.firstName)
  const last = nameWords(player.lastName)
  if (
    first.length === 0 ||
    !first.every((word) => words.has(word) || [...words].some((w) => w.startsWith(word)))
  )
    return 0
  return last.length > 0 && last.some((word) => words.has(word)) ? 2 : 1
}

/** The roster entry that most likely is this member, or null if none (or several) match equally. */
export function suggestPlayer(member: Member, freePlayers: Player[]): Player | null {
  const scored = freePlayers
    .map((player) => ({ player, score: matchScore(member, player) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
  if (scored.length === 0) return null
  if (scored.length > 1 && scored[1].score === scored[0].score) return null
  return scored[0].player
}
