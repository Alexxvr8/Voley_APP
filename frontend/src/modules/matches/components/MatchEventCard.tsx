// A match in the day panel or upcoming list. Competing players answer availability right here (two taps).
import { Link } from 'react-router'
import type { AvailabilityStatus, Match } from '@/shared/domain/types'
import { AvailabilityButtons } from '@/shared/ui/AvailabilityButtons'
import { Card } from '@/shared/ui/Card'
import { hasResult, resultSummary } from '@/shared/domain/results'
import { formatShortDate } from '@/shared/utils/format'

interface MatchEventCardProps {
  match: Match
  /** Link to the match detail screen. */
  href: string
  /** Shown only to a competing player: their current answer and how to change it. */
  availability?: {
    status: AvailabilityStatus | undefined
    calledUp: boolean
    onChange: (status: AvailabilityStatus) => void
  }
}

export function MatchEventCard({ match, href, availability }: MatchEventCardProps) {
  return (
    <Card className="space-y-3 border-l-4 border-l-blue-700">
      <Link to={href} className="block hover:opacity-80">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-blue-800 capitalize">
            {formatShortDate(match.date)}
            {match.matchTime && ` · ${match.matchTime}`}
          </p>
          <span className="text-xs text-slate-500">
            {match.homeAway === 'home' ? 'Local' : 'Visitante'}
          </span>
        </div>
        <p className="mt-1 text-lg font-bold text-slate-900">vs {match.opponent}</p>
        {match.venue && <p className="text-sm text-slate-500">{match.venue}</p>}
        {hasResult(match) && (
          <p className="mt-1 text-sm font-semibold text-slate-800">{resultSummary(match)}</p>
        )}
      </Link>
      {availability && (
        <>
          {availability.calledUp && (
            <p className="text-sm font-semibold text-emerald-700">✓ Estás convocada/o</p>
          )}
          <AvailabilityButtons value={availability.status} onChange={availability.onChange} />
        </>
      )}
    </Card>
  )
}
