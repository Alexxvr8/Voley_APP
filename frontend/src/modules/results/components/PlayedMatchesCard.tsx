// Played matches, newest first, with the result and the points of each set.
import { Link } from 'react-router'
import { resultSummary, setsDetail, setsWon } from '@/shared/domain/results'
import type { Match } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { formatShortDate } from '@/shared/utils/format'

interface PlayedMatchesCardProps {
  matches: Match[]
  /** Link to a match's detail. */
  matchHref: (matchId: string) => string
}

export function PlayedMatchesCard({ matches, matchHref }: PlayedMatchesCardProps) {
  const played = matches
    .filter((match) => match.setsResult.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
  const totals = played.reduce(
    (sum, match) => {
      const { us, them } = setsWon(match.setsResult)
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
      {played.map((match) => {
        const { us, them } = setsWon(match.setsResult)
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
                {formatShortDate(match.date)} · {setsDetail(match.setsResult)}
              </span>
            </span>
            <span className="text-xs font-semibold text-slate-600">
              {resultSummary(match.setsResult).split(' ')[0]}
            </span>
          </Link>
        )
      })}
    </Card>
  )
}
