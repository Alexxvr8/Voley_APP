// Practical match details: times, venue with its map, home/away, notes and the result once played.
import type { Match } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { MapEmbed } from '@/shared/ui/MapEmbed'
import { formatWarmup } from '@/shared/utils/format'
import { ResultSummary } from './ResultSummary'

export function MatchInfoCard({ match }: { match: Match }) {
  return (
    <Card className="space-y-4">
      <ResultSummary result={match} />

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-slate-500">Partido</dt>
        <dd className="font-medium">{match.matchTime || '—'}</dd>

        <dt className="text-slate-500">Calentamiento</dt>
        <dd className="font-medium">{formatWarmup(match.warmupMinutes, match.matchTime) || '—'}</dd>

        <dt className="text-slate-500">Pabellón</dt>
        <dd className="font-medium">{match.venue || '—'}</dd>

        <dt className="text-slate-500">Juega</dt>
        <dd className="font-medium">{match.homeAway === 'home' ? 'Local' : 'Visitante'}</dd>

        {match.notes && (
          <>
            <dt className="text-slate-500">Notas</dt>
            <dd>{match.notes}</dd>
          </>
        )}
      </dl>

      <MapEmbed venue={match.venue} mapsUrl={match.mapsUrl} />
    </Card>
  )
}
