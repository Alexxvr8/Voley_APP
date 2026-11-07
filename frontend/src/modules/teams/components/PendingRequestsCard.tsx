// Players who joined with the code and wait for the coach: accept (link to a roster entry) or reject.
import { useState } from 'react'
import type { Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '@/shared/ui/form'
import { useRemoveMember } from '../api'
import type { Member } from '../members'
import { AcceptMemberDialog } from './AcceptMemberDialog'

interface PendingRequestsCardProps {
  teamId: string
  pending: Member[]
  freePlayers: Player[]
}

export function PendingRequestsCard({ teamId, pending, freePlayers }: PendingRequestsCardProps) {
  const remove = useRemoveMember(teamId)
  const [accepting, setAccepting] = useState<Member | null>(null)
  const [rejecting, setRejecting] = useState<Member | null>(null)

  return (
    <Card className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold">Solicitudes pendientes</p>
        <span className="text-sm text-slate-500">{pending.length}</span>
      </div>
      {pending.length === 0 && (
        <p className="text-sm text-slate-500">
          Nadie esperando. Pasa el código de jugadores para que entren.
        </p>
      )}

      {pending.map((member) => (
        <div key={member.userId} className="flex items-center gap-3 border-t border-slate-100 pt-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-slate-900">{member.displayName}</p>
            <p className="text-xs text-slate-500">@{member.username}</p>
          </div>
          <button
            type="button"
            onClick={() => setRejecting(member)}
            className={SECONDARY_BUTTON_CLASS}
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => setAccepting(member)}
            className={PRIMARY_BUTTON_CLASS}
          >
            Aceptar
          </button>
        </div>
      ))}

      {accepting && (
        <AcceptMemberDialog
          teamId={teamId}
          member={accepting}
          freePlayers={freePlayers}
          onClose={() => setAccepting(null)}
        />
      )}
      {rejecting && (
        <ConfirmDialog
          title={`¿Rechazar a ${rejecting.displayName}?`}
          confirmLabel="Rechazar"
          busy={remove.isPending}
          onCancel={() => setRejecting(null)}
          onConfirm={() => remove.mutate(rejecting.userId, { onSuccess: () => setRejecting(null) })}
        >
          Saldrá de la lista. Si era un error, podrá volver a entrar con el código.
        </ConfirmDialog>
      )}
    </Card>
  )
}
