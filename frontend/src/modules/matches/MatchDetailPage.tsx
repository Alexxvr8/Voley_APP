// "Info" tab of a match: practical details, map and result. Competing players answer their
// availability here; staff see a summary of the answers, record the result and edit the match.
import { Link, useParams } from 'react-router'
import { hasRole, useCurrentTeam, useTeamPath } from '@/core/teams/currentTeam'
import { Card } from '@/shared/ui/Card'
import { SECONDARY_BUTTON_CLASS } from '@/shared/ui/form'
import { MatchHeader } from '@/shared/ui/MatchHeader'
import { PageMessage } from '@/shared/ui/PageMessage'
import {
  useAvailability,
  useCallups,
  useMatches,
  usePlayers,
  useSetAvailability,
  useSetMatchResult,
} from './api'
import { MatchInfoCard } from './components/MatchInfoCard'
import { MyAvailabilityCard } from './components/MyAvailabilityCard'
import { ResultEditor } from './components/ResultEditor'

export function MatchDetailPage() {
  const { matchId = '' } = useParams()
  const { team, role, playerId } = useCurrentTeam()
  const teamPath = useTeamPath()
  const matches = useMatches(team.id)
  const players = usePlayers(team.id)
  const availability = useAvailability(matchId)
  const callups = useCallups(matchId)
  const setAvailability = useSetAvailability()
  const setResult = useSetMatchResult(team.id, matchId)

  if (matches.isPending || players.isPending || availability.isPending || callups.isPending) {
    return <PageMessage>Cargando…</PageMessage>
  }
  if (matches.isError || players.isError || availability.isError || callups.isError) {
    return <PageMessage>No se ha podido cargar el partido. ¿Hay conexión?</PageMessage>
  }
  const match = matches.data.find((m) => m.id === matchId)
  if (!match) return <PageMessage>Partido no encontrado.</PageMessage>

  const isStaff = hasRole(role, 'assistant')
  const me = players.data.find((player) => player.id === playerId)
  const competing = players.data.filter((player) => player.competes)
  const answers = competing.map((player) => availability.data[player.id]?.status)

  return (
    <section className="space-y-4">
      <MatchHeader
        match={match}
        backHref={teamPath('partidos')}
        matchPath={teamPath(`partidos/${match.id}`)}
        showManagement={isStaff}
        showRotation={isStaff && team.enabledModules.includes('lineup')}
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <MatchInfoCard match={match} />

        {isStaff && (
          <div className="space-y-4">
            <Card className="space-y-2">
              <p className="font-semibold">Respuestas</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                <span className="text-emerald-700">
                  Sí {answers.filter((a) => a === 'yes').length}
                </span>
                <span className="text-rose-700">No {answers.filter((a) => a === 'no').length}</span>
                <span className="text-amber-700">
                  Duda {answers.filter((a) => a === 'maybe').length}
                </span>
                <span>Sin responder {answers.filter((a) => a === undefined).length}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {callups.data.length} convocados
              </p>
            </Card>
            <ResultEditor
              key={JSON.stringify(match.setsResult)}
              saved={match.setsResult}
              busy={setResult.isPending}
              failed={setResult.isError}
              onSave={(sets) => setResult.mutate(sets)}
            />
            {team.enabledModules.includes('lineup') && (
              <Link
                to={teamPath(`partidos/${match.id}/partido`)}
                className="block rounded-xl bg-blue-800 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-900"
              >
                Ir al partido
              </Link>
            )}
            <Link
              to={teamPath(`partidos/${match.id}/editar`)}
              className={`block text-center ${SECONDARY_BUTTON_CLASS}`}
            >
              Editar o borrar partido
            </Link>
          </div>
        )}

        {!isStaff &&
          match.status !== 'played' &&
          (me?.competes ? (
            <MyAvailabilityCard
              answer={availability.data[me.id]}
              isCalledUp={callups.data.some((callup) => callup.playerId === me.id)}
              onChange={(status, comment) =>
                setAvailability.mutate({ matchId: match.id, playerId: me.id, status, comment })
              }
            />
          ) : (
            <PageMessage>
              Estás en la plantilla como "solo entrena", así que no juegas partidos.
            </PageMessage>
          ))}
      </div>
    </section>
  )
}
