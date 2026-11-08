// Played matches, newest first, with the result and the points of each set (when recorded).
import { Link } from 'react-router'
import { matchScore, outcomeLabel, setsDetail } from '@/shared/domain/results'
import type { FinalScore, Match } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { formatShortDate } from '@/shared/utils/format'

interface PlayedMatchesCardProps {
  matches: Match[]
  /** Link to a match's detail. */
  matchHref: (matchId: string) => string
}

/** Matches with a result, each with its score in sets. */
function withScores(matches: Match[]): { match: Match; score: FinalScore }[] {
  return matches.flatMap((match) => {
    const score = matchScore(match)
    return score ? [{ match, score }] : []
  })
}

export function PlayedMatchesCard({ matches, matchHref }: PlayedMatchesCardProps) {
  const played = withScores(matches).sort((a, b) => b.match.date.localeCompare(a.match.date))
  const totals = played.reduce(
    (sum, { score: { us, them } }) => {
      return us > them
        ? { ...sum, won: sum.won + 1 }
        : us < them
          ? { ...sum, lost: sum.lost + 1 }
          : sum
    },
    { won: 0, lost: 0 },
  )

  return (
    <Card className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold">Partidos jugados</p>
        {played.length > 0 && (
          <span className="text-sm text-slate-500">
            {totals.won} ganados · {totals.lost} perdidos
          </span>
        )}
      </div>
      {played.length === 0 && (
        <p className="text-sm text-slate-500">
          Aún no hay resultados. Se apuntan en la pestaña Info de cada partido.
        </p>
      )}
      {played.map(({ match, score }) => {
        const { us, them } = score
        const detail = setsDetail(match.setsResult)
        return (
          <Link
            key={match.id}
            to={matchHref(match.id)}
            className="flex items-center gap-3 border-t border-slate-100 pt-2 hover:opacity-80"
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                us > them ? 'bg-emerald-600' : us < them ? 'bg-rose-600' : 'bg-slate-500'
              }`}
            >
              {us}-{them}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-slate-900">
                vs {match.opponent}
              </span>
              <span className="block text-xs text-slate-500 first-letter:uppercase">
                {formatShortDate(match.date)}
                {detail && ` · ${detail}`}
              </span>
            </span>
            <span className="text-xs font-semibold text-slate-600">{outcomeLabel(score)}</span>
          </Link>
        )
      })}
    </Card>
  )
}
