// Accepted members with their role. The coach can give a temporary password to someone who lost theirs.
import { useState } from 'react'
import { ROLE_LABELS } from '@/shared/domain/labels'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useCoachResetPassword } from '../api'
import type { Member } from '../members'

export function MembersCard({ teamId, members }: { teamId: string; members: Member[] }) {
  const resetPassword = useCoachResetPassword(teamId)
  const [resetting, setResetting] = useState<Member | null>(null)
  const [temporary, setTemporary] = useState<{ member: Member; password: string } | null>(null)

  function confirmReset(member: Member) {
    resetPassword.mutate(member.userId, {
      onSuccess: (password) => {
        setResetting(null)
        setTemporary({ member, password })
      },
    })
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold">Miembros</p>
        <span className="text-sm text-slate-500">{members.length}</span>
      </div>

      {members.map((member) => (
        <div key={member.userId} className="flex items-center gap-3 border-t border-slate-100 pt-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900">{member.displayName}</p>
            <p className="text-xs text-slate-500">
              @{member.username} · {ROLE_LABELS[member.role]}
            </p>
          </div>
          {member.role !== 'coach' && (
            <button
              type="button"
              onClick={() => setResetting(member)}
              className="text-xs font-medium text-blue-800 underline"
            >
              Contraseña temporal
            </button>
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
      {resetting && (
        <ConfirmDialog
          title={`¿Contraseña temporal para ${resetting.displayName}?`}
          confirmLabel="Crear contraseña"
          busy={resetPassword.isPending}
          onCancel={() => setResetting(null)}
          onConfirm={() => confirmReset(resetting)}
        >
          Su contraseña actual dejará de funcionar. Úsalo solo si la ha olvidado y no tiene su
          código de recuperación.
        </ConfirmDialog>
      )}
    </Card>
  )
}
