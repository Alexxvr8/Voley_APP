// Deletes the whole team. Double check: the coach has to type the team name.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { Team } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { ERROR_CLASS, INPUT_CLASS } from '@/shared/ui/form'
import { useDeleteTeam } from '../api'

export function DeleteTeamCard({ team }: { team: Team }) {
  const deleteTeam = useDeleteTeam(team.id)
  const navigate = useNavigate()
  const [typed, setTyped] = useState('')

  return (
    <Card className="space-y-3 ring-rose-200">
      <p className="font-semibold text-rose-800">Borrar el equipo</p>
      <p className="text-sm text-slate-600">
        Se borran la plantilla, los partidos, las convocatorias, los entrenamientos y los planes. No
        se puede deshacer. Escribe <strong>{team.name}</strong> para confirmarlo.
      </p>
      <input
        className={INPUT_CLASS}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        aria-label="Nombre del equipo para confirmar"
      />
      {deleteTeam.isError && <p className={ERROR_CLASS}>No se ha podido borrar.</p>}
      <button
        type="button"
        disabled={typed.trim() !== team.name || deleteTeam.isPending}
        onClick={() => deleteTeam.mutate(undefined, { onSuccess: () => navigate('/') })}
        className="w-full rounded-xl bg-rose-700 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-40"
      >
        {deleteTeam.isPending ? 'Borrando…' : 'Borrar equipo'}
      </button>
    </Card>
  )
}
