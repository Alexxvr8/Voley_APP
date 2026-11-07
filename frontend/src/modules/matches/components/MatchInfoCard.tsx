// Practical match details: times, venue (opens Maps) and home/away.
import type { Match } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'

/** Google Maps link: the one saved with the match, or a search for the venue name. */
function mapsLink(match: Match): string {
  return (
    match.mapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.venue)}`
  )
}

export function MatchInfoCard({ match }: { match: Match }) {
  return (
    <Card>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-slate-500">Calentamiento</dt>
        <dd className="font-medium">{match.warmupTime || '—'}</dd>

        <dt className="text-slate-500">Partido</dt>
        <dd className="font-medium">{match.matchTime || '—'}</dd>

        <dt className="text-slate-500">Pabellón</dt>
        <dd>
          {match.venue ? (
            <a
              href={mapsLink(match)}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-blue-800 underline"
            >
              {match.venue}
            </a>
          ) : (
            '—'
          )}
        </dd>

        <dt className="text-slate-500">Juega</dt>
        <dd className="font-medium">{match.homeAway === 'home' ? 'Local' : 'Visitante'}</dd>

        {match.notes && (
          <>
            <dt className="text-slate-500">Notas</dt>
            <dd>{match.notes}</dd>
          </>
        )}
      </dl>
    </Card>
  )
}
