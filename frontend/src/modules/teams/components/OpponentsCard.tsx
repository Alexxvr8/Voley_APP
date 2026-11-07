// The team's usual opponents. The match form suggests them; any other name can still be typed.
import { useState, type FormEvent } from 'react'
import { Card } from '@/shared/ui/Card'
import { ERROR_CLASS, INPUT_CLASS, PRIMARY_BUTTON_CLASS } from '@/shared/ui/form'
import { useAddOpponent, useDeleteOpponent, useTeamOpponents } from '../api'

export function OpponentsCard({ teamId }: { teamId: string }) {
  const opponents = useTeamOpponents(teamId)
  const addOpponent = useAddOpponent(teamId)
  const deleteOpponent = useDeleteOpponent(teamId)
  const [name, setName] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    addOpponent.mutate(name.trim(), { onSuccess: () => setName('') })
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-semibold">Rivales</p>
        <p className="text-sm text-slate-500">
          Equipos de tu liga. Salen como sugerencia al crear un partido.
        </p>
      </div>
      {opponents.data?.length === 0 && (
        <p className="text-sm text-slate-500">Aún no hay rivales.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {opponents.data?.map((opponent) => (
          <span
            key={opponent.id}
            className="flex items-center gap-2 rounded-full bg-slate-100 py-1 pr-2 pl-3 text-sm"
          >
            {opponent.name}
            <button
              type="button"
              onClick={() => deleteOpponent.mutate(opponent.id)}
              aria-label={`Quitar ${opponent.name}`}
              className="text-slate-400 hover:text-rose-700"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-100 pt-3">
        <input
          className={INPUT_CLASS}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del rival"
          aria-label="Nombre del rival"
          required
        />
        <button type="submit" disabled={addOpponent.isPending} className={PRIMARY_BUTTON_CLASS}>
          Añadir
        </button>
      </form>
      {addOpponent.isError && (
        <p className={ERROR_CLASS}>No se ha podido añadir. ¿Ya está en la lista?</p>
      )}
    </Card>
  )
}
