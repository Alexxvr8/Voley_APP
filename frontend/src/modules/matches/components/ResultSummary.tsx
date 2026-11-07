// Read-only result of a played match: "Ganado 3-1" and the points of each set.
import { resultSummary, setsDetail, setsWon } from '@/shared/domain/results'
import type { SetScore } from '@/shared/domain/types'

export function ResultSummary({ sets }: { sets: SetScore[] }) {
  if (sets.length === 0) return null
  const { us, them } = setsWon(sets)
  const color = us > them ? 'text-emerald-700' : us < them ? 'text-rose-700' : 'text-slate-700'

  return (
    <div>
      <p className={`font-bold ${color}`}>{resultSummary(sets)}</p>
      <p className="text-sm text-slate-500">{setsDetail(sets)}</p>
    </div>
  )
}
