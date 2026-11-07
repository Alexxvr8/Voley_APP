// One team in "Mis equipos": name, category, the user's role or pending state, and "Salir" for
// non-coaches (the coach hands the team over in Ajustes first).
import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/core/auth/auth'
import { ROLE_LABELS } from '@/shared/domain/labels'
import type { MyTeam } from '@/shared/domain/types'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useLeaveTeam } from '../api'

export function TeamCard({ team }: { team: MyTeam }) {
  const { user } = useAuth()
  const leaveTeam = useLeaveTeam()
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const details = [team.category, team.season].filter(Boolean).join(' · ')

  return (
    <div
      style={{ borderLeftColor: team.color }}
      className="rounded-2xl border-l-8 bg-white shadow-sm ring-1 ring-slate-200 hover:ring-blue-300"
    >
      <Link to={`/equipos/${team.id}`} className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-slate-900">{team.name}</p>
          {details && <p className="text-sm text-slate-500">{details}</p>}
        </div>
        {team.pending ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Pendiente
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">
            {ROLE_LABELS[team.role]}
          </span>
        )}
      </Link>
      {team.role !== 'coach' && (
        <div className="border-t border-slate-100 px-4 py-2 text-right">
          <button
            type="button"
            onClick={() => setConfirmingLeave(true)}
            className="text-xs font-medium text-rose-700 underline"
          >
            {team.pending ? 'Cancelar solicitud' : 'Salir del equipo'}
          </button>
        </div>
      )}

      {confirmingLeave && user && (
        <ConfirmDialog
          title={`¿Salir de ${team.name}?`}
          confirmLabel="Salir"
          busy={leaveTeam.isPending}
          onCancel={() => setConfirmingLeave(false)}
          onConfirm={() =>
            leaveTeam.mutate(
              { teamId: team.id, userId: user.id },
              { onSuccess: () => setConfirmingLeave(false) },
            )
          }
        >
          Dejarás de ver el equipo. Para volver necesitarás un código y, si eres jugador, que el
          entrenador te acepte otra vez.
        </ConfirmDialog>
      )}
    </div>
  )
}
