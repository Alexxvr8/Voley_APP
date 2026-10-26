import { Link } from 'react-router'
import { useSession } from '@/core/session/session'
import { matches, players } from '@/shared/mock/data'
import { setAvailability, useMockStore } from '@/shared/mock/store'
import { AvailabilityButtons } from '@/shared/ui/AvailabilityButtons'
import { Card } from '@/shared/ui/Card'
import { formatShortDate } from '@/shared/utils/format'

export function MatchesPage() {
  const { playerId } = useSession()
  const { availability, callups } = useMockStore()
  const upcoming = [...matches].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <section className="space-y-3">
      <h1 className="text-xl font-bold text-slate-900">Próximos partidos</h1>
      {upcoming.map((match) => {
        const answers = availability[match.id] ?? {}
        const matchCallups = callups[match.id] ?? []
        const counts = { yes: 0, no: 0, maybe: 0 }
        Object.values(answers).forEach((entry) => counts[entry.status]++)
        const pending = players.length - counts.yes - counts.no - counts.maybe

        return (
          <Card key={match.id} className="space-y-3">
            <Link to={`/partidos/${match.id}`} className="block">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium capitalize text-blue-800">
                  {formatShortDate(match.date)} · {match.matchTime}
                </p>
                <span className="text-xs text-slate-500">{match.homeAway === 'home' ? 'Local' : 'Visitante'}</span>
              </div>
              <p className="mt-1 text-lg font-bold text-slate-900">vs {match.opponent}</p>
              <p className="text-sm text-slate-500">{match.venue}</p>
            </Link>

            {playerId ? (
              <>
                {matchCallups.includes(playerId) && (
                  <p className="text-sm font-semibold text-emerald-700">✓ Estás convocada/o</p>
                )}
                <AvailabilityButtons
                  value={answers[playerId]?.status}
                  onChange={(status) => setAvailability(match.id, playerId, status)}
                />
              </>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
                <span className="text-emerald-700">Sí {counts.yes}</span>
                <span className="text-rose-700">No {counts.no}</span>
                <span className="text-amber-700">Duda {counts.maybe}</span>
                <span>Sin responder {pending}</span>
                <span className="ml-auto font-semibold text-slate-800">Convocados {matchCallups.length}</span>
              </div>
            )}
          </Card>
        )
      })}
    </section>
  )
}
