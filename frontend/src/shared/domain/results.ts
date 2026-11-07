// Match result helpers: sets won and the Spanish summary shown on cards (no React here).
import type { SetScore } from './types'

/** Sets won by each side. A set counts for whoever scored more points. */
export function setsWon(sets: SetScore[]): { us: number; them: number } {
  return {
    us: sets.filter((set) => set.us > set.them).length,
    them: sets.filter((set) => set.them > set.us).length,
  }
}

/** `Ganado 3-1`, `Perdido 1-3` or `Empate 2-2`; empty when no set has been recorded. */
export function resultSummary(sets: SetScore[]): string {
  if (sets.length === 0) return ''
  const { us, them } = setsWon(sets)
  const outcome = us > them ? 'Ganado' : us < them ? 'Perdido' : 'Empate'
  return `${outcome} ${us}-${them}`
}

/** `25-20 · 23-25 · 25-18`. */
export function setsDetail(sets: SetScore[]): string {
  return sets.map((set) => `${set.us}-${set.them}`).join(' · ')
}
