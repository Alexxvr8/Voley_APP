// Match result helpers: sets won, the Spanish summary shown on cards and the scores each match
// format allows (no React here).
import type { FinalScore, Match, SetScore, SetsFormat } from './types'

/** The part of a match that holds its result. */
export type MatchResult = Pick<Match, 'setsResult' | 'finalScore'>

export const SETS_FORMATS: SetsFormat[] = ['best_of_5', 'best_of_3', 'fixed_3', 'fixed_1']

export const SETS_FORMAT_LABELS: Record<SetsFormat, string> = {
  best_of_5: 'Al mejor de 5',
  best_of_3: 'Al mejor de 3',
  fixed_3: '3 sets fijos',
  fixed_1: '1 set',
}

/** Most sets a match of this format can have (rows in the points editor). */
export const MAX_SETS: Record<SetsFormat, number> = {
  best_of_5: 5,
  best_of_3: 3,
  fixed_3: 3,
  fixed_1: 1,
}

/** Set numbers a match of this format can have: best of 3 → [1, 2, 3]. Unknown format → 5 sets. */
export function setNumbersFor(format: SetsFormat | undefined): number[] {
  return Array.from({ length: (format && MAX_SETS[format]) || 5 }, (_, i) => i + 1)
}

/** Sets won by each side. A set counts for whoever scored more points. */
export function setsWon(sets: SetScore[]): FinalScore {
  return {
    us: sets.filter((set) => set.us > set.them).length,
    them: sets.filter((set) => set.them > set.us).length,
  }
}

/** Every final score possible in a format, wins first: best of 3 → 2-0, 2-1, 1-2, 0-2. */
export function possibleScores(format: SetsFormat): FinalScore[] {
  if (format === 'best_of_5' || format === 'best_of_3') {
    const toWin = format === 'best_of_5' ? 3 : 2
    const wins: FinalScore[] = []
    const losses: FinalScore[] = []
    for (let setsOfLoser = 0; setsOfLoser < toWin; setsOfLoser++) {
      wins.push({ us: toWin, them: setsOfLoser })
      losses.unshift({ us: setsOfLoser, them: toWin })
    }
    return [...wins, ...losses]
  }
  const total = MAX_SETS[format]
  return Array.from({ length: total + 1 }, (_, i) => ({ us: total - i, them: i }))
}

/** Sets won in a match: the final score if only that was recorded, otherwise counted from the sets. */
export function matchScore(result: MatchResult): FinalScore | null {
  if (result.finalScore) return result.finalScore
  return result.setsResult.length ? setsWon(result.setsResult) : null
}

/** True once the match has a result, either by sets or as a final score. */
export function hasResult(result: MatchResult): boolean {
  return matchScore(result) !== null
}

/** `Ganado`, `Perdido` or `Empate` for a score. */
export function outcomeLabel(score: FinalScore): string {
  return score.us > score.them ? 'Ganado' : score.us < score.them ? 'Perdido' : 'Empate'
}

/** `Ganado 3-1`, `Perdido 1-3` or `Empate 2-2`; empty when there is no result. */
export function resultSummary(result: MatchResult): string {
  const score = matchScore(result)
  return score ? `${outcomeLabel(score)} ${score.us}-${score.them}` : ''
}

/** `25-20 · 23-25 · 25-18`; empty when only the final score is known. */
export function setsDetail(sets: SetScore[]): string {
  return sets.map((set) => `${set.us}-${set.them}`).join(' · ')
}
