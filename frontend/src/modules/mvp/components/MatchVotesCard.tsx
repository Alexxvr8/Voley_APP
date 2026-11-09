// List of matches with the state of their MVP vote; each row opens the match's vote screen.
import { Link } from 'react-router'
import type { Match } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { formatShortDate } from '@/shared/utils/format'

interface MatchVotesCardProps {
  title: string
  matches: Match[]
  /** Text under the opponent, e.g. "Cierra en 20 h" or the MVP's name. */
  detail: (match: Match) => string
  /** Short label at the right, e.g. "Votar". */
  action?: (match: Match) => string
  matchHref: (matchId: string) => string
  /** Shown when the list is empty; without it, an empty card is not rendered. */
  empty?: string
}

export function MatchVotesCard({
  title,
  matches,
  detail,
  action,
  matchHref,
  empty,
}: MatchVotesCardProps) {
  if (matches.length === 0 && !empty) return null
  return (
    <Card className="space-y-2">
      <p className="font-semibold">{title}</p>
      {matches.length === 0 && <p className="text-sm text-slate-500">{empty}</p>}
      {matches.map((match) => (
        <Link
          key={match.id}
          to={matchHref(match.id)}
          className="flex items-center gap-3 border-t border-slate-100 pt-2 hover:opacity-80"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-slate-900">vs {match.opponent}</span>
            <span className="block truncate text-xs text-slate-500 first-letter:uppercase">
              {formatShortDate(match.date)} · {detail(match)}
            </span>
          </span>
          {action && (
            <span className="shrink-0 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800">
              {action(match)}
            </span>
          )}
        </Link>
      ))}
    </Card>
  )
}
