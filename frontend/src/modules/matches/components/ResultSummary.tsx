// Read-only result of a played match: "Ganado 3-1" and, when recorded, the points of each set.
import { matchScore, resultSummary, setsDetail, type MatchResult } from '@/shared/domain/results'

export function ResultSummary({ result }: { result: MatchResult }) {
  const score = matchScore(result)
  if (!score) return null
  const color =
    score.us > score.them
      ? 'text-emerald-700'
      : score.us < score.them
        ? 'text-rose-700'
        : 'text-slate-700'
  const detail = setsDetail(result.setsResult)

  return (
    <div>
      <p className={`font-bold ${color}`}>{resultSummary(result)}</p>
      {detail && <p className="text-sm text-slate-500">{detail}</p>}
    </div>
  )
}
