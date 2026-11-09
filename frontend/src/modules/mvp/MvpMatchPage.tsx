// MVP vote of one match: vote or change the vote while open; the coach also sees the count, closes
// the vote early, opens it if it never opened and breaks ties.
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { hasRole, useCurrentTeam, useTeamPath } from '@/core/teams/currentTeam'
import type { Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { ERROR_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '@/shared/ui/form'
import { PageMessage } from '@/shared/ui/PageMessage'
import { byShirtNumber, formatLongDate } from '@/shared/utils/format'
import {
  useCallups,
  useCloseVote,
  useMatches,
  useMvpTally,
  useMyVote,
  useOpenVote,
  usePlayers,
  useSettleExpiredVotes,
} from './api'
import { TallyCard } from './components/TallyCard'
import { TieCard } from './components/TieCard'
import { VoteCard } from './components/VoteCard'
import { WinnerCard } from './components/WinnerCard'
import { closesInLabel, topVoted, votePhase } from './mvp'

/** Roster entries for a list of ids, skipping deleted ones. */
function pick(ids: string[], playersById: Map<string, Player>): Player[] {
  return ids.flatMap((id) => playersById.get(id) ?? [])
}

export function MvpMatchPage() {
  const { matchId = '' } = useParams()
  const { team, role, playerId } = useCurrentTeam()
  const teamPath = useTeamPath()
  const [now] = useState(() => new Date())
  const [confirmClose, setConfirmClose] = useState(false)
  const isCoach = hasRole(role, 'coach')

  const matches = useMatches(team.id)
  const players = usePlayers(team.id)
  const callups = useCallups(matchId)
  const match = matches.data?.find((candidate) => candidate.id === matchId)
  const phase = match ? votePhase(match, now) : 'none'
  const calledUpIds = (callups.data ?? []).map((callup) => callup.playerId)
  const canVote =
    isCoach || (role === 'player' && playerId !== null && calledUpIds.includes(playerId))
  const myVote = useMyVote(matchId, canVote && phase === 'open')
  const tally = useMvpTally(matchId, isCoach && phase !== 'none')
  const openVote = useOpenVote(team.id, matchId)
  const closeVote = useCloseVote(team.id, matchId)
  useSettleExpiredVotes(team.id, phase === 'expired' ? [matchId] : [])

  if (matches.isPending || players.isPending || callups.isPending)
    return <PageMessage>Cargando…</PageMessage>
  if (matches.isError || players.isError || callups.isError)
    return <PageMessage>No se ha podido cargar la votación. ¿Hay conexión?</PageMessage>
  if (!match) return <PageMessage>Este partido no existe o se ha borrado.</PageMessage>

  const playersById = new Map(players.data.map((player) => [player.id, player]))
  const candidates = pick(calledUpIds, playersById)
    .filter((player) => player.id !== playerId)
    .sort(byShirtNumber)
  const tallyCard = isCoach && <TallyCard tally={tally.data} playersById={playersById} />

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <Link to={teamPath('mvp')} className="text-sm font-medium text-blue-800">
          ← MVP
        </Link>
        <p className="text-sm font-medium text-blue-800 first-letter:uppercase">
          {formatLongDate(match.date)}
        </p>
        <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">vs {match.opponent}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {match.status !== 'played' && (
          <PageMessage>
            El partido aún no se ha jugado. La votación se abre al apuntar el resultado.
          </PageMessage>
        )}

        {match.status === 'played' && phase === 'none' && (
          <Card className="space-y-3">
            <p className="font-semibold">No hay votación para este partido</p>
            {isCoach && (
              <>
                <p className="text-sm text-slate-500">
                  Ábrela y las convocadas podrán votar durante 48 h.
                </p>
                {openVote.isError && (
                  <p className={ERROR_CLASS}>No se ha podido abrir. Prueba otra vez.</p>
                )}
                <button
                  type="button"
                  disabled={openVote.isPending}
                  onClick={() => openVote.mutate()}
                  className={`w-full ${PRIMARY_BUTTON_CLASS}`}
                >
                  {openVote.isPending ? 'Abriendo…' : 'Abrir votación'}
                </button>
              </>
            )}
          </Card>
        )}

        {phase === 'expired' && <PageMessage>Cerrando la votación…</PageMessage>}

        {phase === 'open' && (
          <>
            {canVote ? (
              myVote.isPending ? (
                <PageMessage>Cargando…</PageMessage>
              ) : (
                <VoteCard
                  key={(myVote.data ?? []).join(',')}
                  teamId={team.id}
                  matchId={matchId}
                  candidates={candidates}
                  myVote={myVote.data ?? []}
                  closesIn={closesInLabel(match.mvpClosesAt!, now)}
                />
              )
            ) : (
              <Card>
                <p className="font-semibold">Votación abierta</p>
                <p className="text-sm text-slate-500">
                  Votan las convocadas y el entrenador. {closesInLabel(match.mvpClosesAt!, now)}.
                </p>
              </Card>
            )}
            {isCoach && (
              <div className="space-y-4">
                {tallyCard}
                <button
                  type="button"
                  onClick={() => setConfirmClose(true)}
                  className={`w-full ${SECONDARY_BUTTON_CLASS}`}
                >
                  Cerrar votación ya
                </button>
                {closeVote.isError && (
                  <p className={ERROR_CLASS}>No se ha podido cerrar. Prueba otra vez.</p>
                )}
              </div>
            )}
          </>
        )}

        {phase === 'tie' &&
          (isCoach ? (
            <>
              {tally.data && (
                <TieCard
                  teamId={team.id}
                  matchId={matchId}
                  tied={pick(topVoted(tally.data.votes), playersById)}
                />
              )}
              {tallyCard}
            </>
          ) : (
            <Card>
              <p className="font-semibold">Resultado pendiente</p>
              <p className="text-sm text-slate-500">Hay empate y el entrenador está decidiendo.</p>
            </Card>
          ))}

        {phase === 'finished' && (
          <>
            <WinnerCard winners={pick(match.mvpWinners, playersById)} />
            {tallyCard}
          </>
        )}
      </div>

      {confirmClose && (
        <ConfirmDialog
          title="¿Cerrar la votación?"
          confirmLabel="Cerrar"
          busy={closeVote.isPending}
          onCancel={() => setConfirmClose(false)}
          onConfirm={() => closeVote.mutate(undefined, { onSettled: () => setConfirmClose(false) })}
        >
          Ya no se podrá votar. Si hay empate, tendrás que elegir a la MVP.
        </ConfirmDialog>
      )}
    </section>
  )
}
