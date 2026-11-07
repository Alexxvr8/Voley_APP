// Team name, category and season, editable by the coach.
import { useState, type FormEvent } from 'react'
import type { Team } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '@/shared/ui/form'
import { useUpdateTeamDetails } from '../api'

export function TeamDetailsCard({ team }: { team: Team }) {
  const update = useUpdateTeamDetails(team.id)
  const [name, setName] = useState(team.name)
  const [category, setCategory] = useState(team.category)
  const [season, setSeason] = useState(team.season)
  const changed = name !== team.name || category !== team.category || season !== team.season

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    update.mutate({ name: name.trim(), category: category.trim(), season: season.trim() })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <p className="col-span-2 font-semibold">Datos del equipo</p>
        <label className={`col-span-2 ${LABEL_CLASS}`}>
          <span className={LABEL_TEXT_CLASS}>Nombre</span>
          <input
            className={INPUT_CLASS}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
          />
        </label>
        <label className={LABEL_CLASS}>
          <span className={LABEL_TEXT_CLASS}>Categoría</span>
          <input
            className={INPUT_CLASS}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </label>
        <label className={LABEL_CLASS}>
          <span className={LABEL_TEXT_CLASS}>Temporada</span>
          <input
            className={INPUT_CLASS}
            value={season}
            onChange={(e) => setSeason(e.target.value)}
          />
        </label>
        {update.isError && <p className={`col-span-2 ${ERROR_CLASS}`}>No se ha podido guardar.</p>}
        {update.isSuccess && !changed && (
          <p className="col-span-2 text-sm text-emerald-700">Guardado.</p>
        )}
        <button
          type="submit"
          disabled={!changed || update.isPending}
          className={`col-span-2 ${PRIMARY_BUTTON_CLASS}`}
        >
          {update.isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </Card>
  )
}
