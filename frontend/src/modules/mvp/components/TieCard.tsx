// Coach breaks a tie: picks one of the tied players, or several (or all) to keep a co-MVP.
import { useState } from 'react'
import type { Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { ERROR_CLASS, PRIMARY_BUTTON_CLASS } from '@/shared/ui/form'
import { useResolveTie } from '../api'
import { PlayerPickList } from './PlayerPickList'

interface TieCardProps {
  teamId: string
  matchId: string
  /** Players tied at the top. */
  tied: Player[]
}

export function TieCard({ teamId, matchId, tied }: TieCardProps) {
  const [picked, setPicked] = useState<string[]>([])
  const resolve = useResolveTie(teamId, matchId)

  function toggle(id: string) {
    setPicked((current) =>
      current.includes(id) ? current.filter((other) => other !== id) : [...current, id],
    )
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-semibold">Hay empate</p>
        <p className="text-sm text-slate-500">
          Elige a la MVP, o marca a varias para que salgan todas como co-MVP. Mientras tanto las
          jugadoras ven «Resultado pendiente».
        </p>
      </div>
      <PlayerPickList
        players={tied}
        picked={picked}
        onToggle={toggle}
        disabled={resolve.isPending}
      />
      {resolve.isError && <p className={ERROR_CLASS}>No se ha podido guardar. Prueba otra vez.</p>}
      <button
        type="button"
        disabled={picked.length === 0 || resolve.isPending}
        onClick={() => resolve.mutate(picked)}
        className={`w-full ${PRIMARY_BUTTON_CLASS}`}
      >
        {resolve.isPending
          ? 'Guardando…'
          : picked.length > 1
            ? `Co-MVP (${picked.length})`
            : 'Elegir MVP'}
      </button>
    </Card>
  )
}
