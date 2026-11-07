// "Compite" switch of a roster row. Changing it asks for confirmation first (two-step check).
import { useState } from 'react'
import type { Player } from '@/shared/domain/types'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { playerName } from '@/shared/utils/format'
import { useSetCompetes } from '../api'

export function CompetesSwitch({ teamId, player }: { teamId: string; player: Player }) {
  const setCompetes = useSetCompetes(teamId)
  const [confirming, setConfirming] = useState(false)
  const name = playerName(player)

  function confirm() {
    setCompetes.mutate(
      { playerId: player.id, competes: !player.competes },
      { onSuccess: () => setConfirming(false) },
    )
  }

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={player.competes}
        aria-label={`${name}: ${player.competes ? 'compite' : 'solo entrena'}`}
        onClick={() => setConfirming(true)}
        className={`w-28 shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
          player.competes ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
        }`}
      >
        {player.competes ? 'Compite' : 'Solo entrena'}
      </button>

      {confirming && (
        <ConfirmDialog
          title={player.competes ? `¿${name} solo entrena?` : `¿${name} vuelve a competir?`}
          confirmLabel={player.competes ? 'Sí, solo entrena' : 'Sí, compite'}
          busy={setCompetes.isPending}
          onCancel={() => setConfirming(false)}
          onConfirm={confirm}
        >
          {player.competes
            ? 'Dejará de aparecer en la disponibilidad y en la convocatoria de los partidos. Seguirá viendo el calendario y los entrenamientos.'
            : 'Volverá a aparecer en la disponibilidad y en la convocatoria de los partidos.'}
        </ConfirmDialog>
      )}
    </>
  )
}
