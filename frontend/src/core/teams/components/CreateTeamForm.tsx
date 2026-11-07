// "Crear equipo": the user becomes the coach of the new team.
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '@/shared/ui/form'
import { useCreateTeam } from '../api'

export function CreateTeamForm() {
  const createTeam = useCreateTeam()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [season, setSeason] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    createTeam.mutate(
      { name: name.trim(), category: category.trim(), season: season.trim() },
      { onSuccess: (teamId) => navigate(`/equipos/${teamId}/ajustes`) },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">Serás el entrenador del equipo nuevo.</p>
      <label className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Nombre del equipo</span>
        <input
          className={INPUT_CLASS}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Infantil A"
          maxLength={80}
          required
        />
      </label>
      <label className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Categoría (opcional)</span>
        <input
          className={INPUT_CLASS}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Infantil femenino"
        />
      </label>
      <label className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Temporada (opcional)</span>
        <input
          className={INPUT_CLASS}
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          placeholder="2026-27"
        />
      </label>
      {createTeam.isError && (
        <p role="alert" className={ERROR_CLASS}>
          No se ha podido crear el equipo. Inténtalo de nuevo.
        </p>
      )}
      <button type="submit" disabled={createTeam.isPending} className={PRIMARY_BUTTON_CLASS}>
        {createTeam.isPending ? 'Creando…' : 'Crear equipo'}
      </button>
    </form>
  )
}
