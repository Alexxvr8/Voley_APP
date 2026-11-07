// Accepted members with their role. For each one the coach can give a temporary password, remove
// them from the team or hand the team over (make them coach). Every action asks for confirmation.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/core/auth/auth'
import { ROLE_LABELS } from '@/shared/domain/labels'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useCoachResetPassword, useRemoveMember, useTransferTeam } from '../api'
import type { Member } from '../members'

type Action = 'password' | 'remove' | 'transfer'

const ACTION_LABELS: Record<Action, string> = {
  password: 'Contraseña temporal',
  remove: 'Quitar',
  transfer: 'Hacer entrenador',
}

export function MembersCard({ teamId, members }: { teamId: string; members: Member[] }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const resetPassword = useCoachResetPassword(teamId)
  const removeMember = useRemoveMember(teamId)
  const transferTeam = useTransferTeam(teamId)
  const [pending, setPending] = useState<{ member: Member; action: Action } | null>(null)
  const [temporary, setTemporary] = useState<{ member: Member; password: string } | null>(null)
  const busy = resetPassword.isPending || removeMember.isPending || transferTeam.isPending

  function confirm() {
    if (!pending) return
    const { member, action } = pending
    const done = () => setPending(null)
    if (action === 'password') {
      resetPassword.mutate(member.userId, {
        onSuccess: (password) => {
          done()
          setTemporary({ member, password })
        },
      })
    } else if (action === 'remove') {
      removeMember.mutate(member.userId, { onSuccess: done })
    } else {
      // The coach becomes segundo entrenador and loses this screen.
      transferTeam.mutate(member.userId, { onSuccess: () => navigate(`/equipos/${teamId}`) })
    }
  }

  const texts: Record<Action, (name: string) => { title: string; body: string }> = {
    password: (name) => ({
      title: `¿Contraseña temporal para ${name}?`,
      body: 'Su contraseña actual dejará de funcionar. Úsalo solo si no puede recuperarla con su código o su correo.',
    }),
    remove: (name) => ({
      title: `¿Quitar a ${name} del equipo?`,
      body: 'Dejará de ver el equipo. Su ficha de la plantilla se queda. Podrá volver a entrar con un código.',
    }),
    transfer: (name) => ({
      title: `¿Hacer entrenador a ${name}?`,
      body: 'Pasará a ser el entrenador del equipo y tú quedarás como segundo entrenador: ya no verás Ajustes.',
    }),
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold">Miembros</p>
        <span className="text-sm text-slate-500">{members.length}</span>
      </div>

      {members.map((member) => (
        <div
          key={member.userId}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900">{member.displayName}</p>
            <p className="text-xs text-slate-500">
              @{member.username} · {ROLE_LABELS[member.role]}
            </p>
          </div>
          {member.userId !== user?.id && member.role !== 'coach' && (
            <div className="flex flex-wrap gap-3">
              {(Object.keys(ACTION_LABELS) as Action[]).map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => setPending({ member, action })}
                  className={`text-xs font-medium underline ${action === 'remove' ? 'text-rose-700' : 'text-blue-800'}`}
                >
                  {ACTION_LABELS[action]}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {temporary && (
        <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
          Contraseña temporal de <strong>{temporary.member.displayName}</strong>:{' '}
          <span className="font-mono text-base font-bold select-all">{temporary.password}</span>.
          Díselo y que la cambie en "Mi cuenta".
        </div>
      )}
      {pending && (
        <ConfirmDialog
          title={texts[pending.action](pending.member.displayName).title}
          confirmLabel={ACTION_LABELS[pending.action]}
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={confirm}
        >
          {texts[pending.action](pending.member.displayName).body}
        </ConfirmDialog>
      )}
    </Card>
  )
}
