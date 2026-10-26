// Match detail. Players see the info and answer their availability; staff also see
// everyone's answers, call players up and open the set plan.
import { Link, useParams } from 'react-router'
import { useSession } from '@/core/session/session'
import { matches, players } from '@/shared/mock/data'
import { setAvailability, toggleCallup, useMockStore } from '@/shared/mock/store'
import { formatLongDate } from '@/shared/utils/format'
import { CallupList } from './components/CallupList'
import { MatchInfoCard } from './components/MatchInfoCard'
import { MyAvailabilityCard } from './components/MyAvailabilityCard'

export function MatchDetailPage() {
  const { matchId } = useParams()
  const { playerId } = useSession()
  const { availability, callups } = useMockStore()
  const match = matches.find((m) => m.id === matchId)

  if (!match) return <p className="py-12 text-center text-slate-500">Partido no encontrado.</p>

  const answers = availability[match.id] ?? {}
  const calledUpIds = callups[match.id] ?? []

  return (
    <section className="space-y-4">
      <Link to="/partidos" className="text-sm font-medium text-blue-800">
        ← Partidos
      </Link>

      <div>
        <p className="text-sm font-medium capitalize text-blue-800">{formatLongDate(match.date)}</p>
        <h1 className="text-2xl font-bold text-slate-900">vs {match.opponent}</h1>
      </div>

      <MatchInfoCard match={match} />

      {/* A linked player id means the user is viewing as a player; otherwise as staff. */}
      {playerId ? (
        <MyAvailabilityCard
          status={answers[playerId]?.status}
          isCalledUp={calledUpIds.includes(playerId)}
          onChange={(status) => setAvailability(match.id, playerId, status)}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/partidos/${match.id}/plan`}
              className="rounded-xl bg-blue-800 py-3 text-center text-sm font-semibold text-white"
            >
              Preparar partido
            </Link>
            {/* Match mode arrives in phase 2. */}
            <button type="button" disabled className="rounded-xl bg-slate-200 py-3 text-sm font-semibold text-slate-500">
              Ir al partido
            </button>
          </div>

          <CallupList
            players={players}
            answers={answers}
            calledUpIds={calledUpIds}
            onToggle={(id) => toggleCallup(match.id, id)}
          />
        </>
      )}
    </section>
  )
}
