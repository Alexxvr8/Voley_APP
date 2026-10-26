import { Link, useParams } from 'react-router'
import { useSession } from '@/core/session/session'
import { AVAILABILITY_LABELS } from '@/shared/domain/labels'
import type { AvailabilityStatus } from '@/shared/domain/types'
import { matches, players } from '@/shared/mock/data'
import { setAvailability, toggleCallup, useMockStore } from '@/shared/mock/store'
import { AvailabilityButtons } from '@/shared/ui/AvailabilityButtons'
import { Card } from '@/shared/ui/Card'
import { PositionBadge } from '@/shared/ui/PositionBadge'
import { formatLongDate, playerName } from '@/shared/utils/format'

const STATUS_STYLES: Record<AvailabilityStatus, string> = {
  yes: 'bg-emerald-100 text-emerald-800',
  no: 'bg-rose-100 text-rose-800',
  maybe: 'bg-amber-100 text-amber-800',
}

export function MatchDetailPage() {
  const { matchId } = useParams()
  const { playerId } = useSession()
  const { availability, callups } = useMockStore()
  const match = matches.find((m) => m.id === matchId)

  if (!match) return <p className="py-12 text-center text-slate-500">Partido no encontrado.</p>

  const answers = availability[match.id] ?? {}
  const matchCallups = callups[match.id] ?? []

  return (
    <section className="space-y-4">
      <Link to="/partidos" className="text-sm font-medium text-blue-800">
        ← Partidos
      </Link>

      <div>
        <p className="text-sm font-medium capitalize text-blue-800">{formatLongDate(match.date)}</p>
        <h1 className="text-2xl font-bold text-slate-900">vs {match.opponent}</h1>
      </div>

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

      {playerId ? (
        <Card className="space-y-3">
          <p className="font-semibold">¿Puedes venir?</p>
          <AvailabilityButtons
            value={answers[playerId]?.status}
            onChange={(status) => setAvailability(match.id, playerId, status)}
          />
          <p className={`text-sm ${matchCallups.includes(playerId) ? 'text-emerald-700' : 'text-slate-500'}`}>
            {matchCallups.includes(playerId) ? '✓ Estás convocada/o' : 'Convocatoria aún no publicada para ti'}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/partidos/${match.id}/plan`}
              className="rounded-xl bg-blue-800 py-3 text-center text-sm font-semibold text-white"
            >
              Preparar partido
            </Link>
            <button
              type="button"
              disabled
              className="rounded-xl bg-slate-200 py-3 text-sm font-semibold text-slate-500"
              title="Fase 2"
            >
              Ir al partido
            </button>
          </div>

          <Card className="space-y-1">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="font-semibold">Disponibilidad y convocatoria</p>
              <span className="text-sm text-slate-500">{matchCallups.length} convocados</span>
            </div>
            {[...players]
              .sort((a, b) => a.number - b.number)
              .map((player) => {
                const entry = answers[player.id]
                return (
                  <label key={player.id} className="flex items-center gap-3 border-t border-slate-100 py-2">
                    <input
                      type="checkbox"
                      checked={matchCallups.includes(player.id)}
                      onChange={() => toggleCallup(match.id, player.id)}
                      className="size-5 accent-blue-800"
                    />
                    <span className="w-6 text-right text-sm font-bold text-slate-400">{player.number}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium">{playerName(player)}</span>
                      {entry?.comment && <span className="block text-xs text-slate-500">{entry.comment}</span>}
                    </span>
                    <PositionBadge position={player.mainPosition} short />
                    <span
                      className={`w-16 rounded-full py-0.5 text-center text-xs font-semibold ${
                        entry ? STATUS_STYLES[entry.status] : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {entry ? AVAILABILITY_LABELS[entry.status] : '—'}
                    </span>
                  </label>
                )
              })}
          </Card>
        </>
      )}
    </section>
  )
}
