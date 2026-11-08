// Adds a roster entry by hand, for players without an account (or before they join with the code).
import { useState } from 'react'
import { Card } from '@/shared/ui/Card'
import { SECONDARY_BUTTON_CLASS } from '@/shared/ui/form'
import { PlayerForm } from '@/shared/ui/PlayerForm'
import { useAddPlayer } from '../api'

export function ManualPlayerCard({ teamId }: { teamId: string }) {
  const addPlayer = useAddPlayer(teamId)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState<string | null>(null)

  if (adding) {
    return (
      <PlayerForm
        title="Nuevo jugador sin cuenta"
        submitLabel="Añadir"
        busy={addPlayer.isPending}
        failed={addPlayer.isError}
        onSubmit={(player) =>
          addPlayer.mutate(player, {
            onSuccess: () => {
              setAdding(false)
              setAdded(player.firstName)
            },
          })
        }
        onCancel={() => setAdding(false)}
      />
    )
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-semibold">Jugadores sin cuenta</p>
        <p className="text-sm text-slate-500">
          Lo normal es que cada jugador entre con el código. Si alguien no usa la app, crea su ficha
          aquí; si más adelante entra, al aceptarlo podrás unirlo a esta ficha.
        </p>
      </div>
      {added && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {added} ya está en la plantilla.
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          setAdded(null)
          setAdding(true)
        }}
        className={`w-full ${SECONDARY_BUTTON_CLASS}`}
      >
        + Añadir jugador
      </button>
    </Card>
  )
}
