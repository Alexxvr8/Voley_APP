// Staff screen to change a match's details or delete it (asks for confirmation first).
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { hasRole, useCurrentTeam, useTeamPath } from '@/core/teams/currentTeam'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { SECONDARY_BUTTON_CLASS } from '@/shared/ui/form'
import { PageMessage } from '@/shared/ui/PageMessage'
import {
  useDeleteMatch,
  useMatches,
  useSaveOpponent,
  useTeamOpponents,
  useTeamVenues,
  useUpdateMatch,
} from './api'
import { MatchForm } from './components/MatchForm'

export function EditMatchPage() {
  const { matchId = '' } = useParams()
  const { team, role } = useCurrentTeam()
  const teamPath = useTeamPath()
  const navigate = useNavigate()
  const matches = useMatches(team.id)
  const venues = useTeamVenues(team.id)
  const opponents = useTeamOpponents(team.id)
  const updateMatch = useUpdateMatch(team.id, matchId)
  const deleteMatch = useDeleteMatch(team.id)
  const saveOpponent = useSaveOpponent(team.id)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (!hasRole(role, 'assistant'))
    return <PageMessage>No tienes acceso a esta sección.</PageMessage>
  if (matches.isPending || venues.isPending || opponents.isPending) {
    return <PageMessage>Cargando…</PageMessage>
  }
  if (matches.isError)
    return <PageMessage>No se ha podido cargar el partido. ¿Hay conexión?</PageMessage>
  const match = matches.data.find((m) => m.id === matchId)
  if (!match) return <PageMessage>Partido no encontrado.</PageMessage>

  const matchPath = teamPath(`partidos/${match.id}`)

  return (
    <section className="max-w-xl space-y-4">
      <Link to={matchPath} className="text-sm font-medium text-blue-800">
        ← Partido
      </Link>
      <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Editar partido</h1>
      <Card>
        <MatchForm
          initial={match}
          submitLabel="Guardar cambios"
          busy={updateMatch.isPending}
          failed={updateMatch.isError}
          venues={venues.data ?? []}
          opponents={opponents.data ?? []}
          onSubmit={(changes, addOpponent) => {
            if (addOpponent) saveOpponent.mutate(changes.opponent)
            updateMatch.mutate(changes, { onSuccess: () => navigate(matchPath) })
          }}
        />
      </Card>
      <button
        type="button"
        onClick={() => setConfirmingDelete(true)}
        className={`w-full text-rose-700 ${SECONDARY_BUTTON_CLASS}`}
      >
        Borrar partido
      </button>

      {confirmingDelete && (
        <ConfirmDialog
          title={`¿Borrar el partido contra ${match.opponent}?`}
          confirmLabel="Borrar"
          busy={deleteMatch.isPending}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() =>
            deleteMatch.mutate(match.id, { onSuccess: () => navigate(teamPath('partidos')) })
          }
        >
          Se borran también las respuestas de disponibilidad, la convocatoria y los planes de
          rotación. No se puede deshacer.
        </ConfirmDialog>
      )}
    </section>
  )
}
