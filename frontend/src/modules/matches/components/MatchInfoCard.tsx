// Practical match details: times, venue (opens Maps) and home/away.
import type { Match } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'

export function MatchInfoCard({ match }: { match: Match }) {
  return (
    <Card>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-slate-500">Calentamiento</dt>
        <dd className="font-medium">{match.warmupTime}</dd>

        <dt className="text-slate-500">Partido</dt>
        <dd className="font-medium">{match.matchTime}</dd>

        <dt className="text-slate-500">Pabellón</dt>
        <dd>
          <a href={match.mapsUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-800 underline">
            {match.venue}
          </a>
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
