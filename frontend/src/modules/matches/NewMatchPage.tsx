// Staff form to schedule a match. Players never reach it (the button is hidden and the page checks the role).
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { hasRole, useCurrentTeam, useTeamPath } from '@/core/teams/currentTeam'
import { Card } from '@/shared/ui/Card'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '@/shared/ui/form'
import { PageMessage } from '@/shared/ui/PageMessage'
import { todayIso } from '@/shared/utils/format'
import { useCreateMatch, type NewMatch } from './api'

const EMPTY_MATCH: NewMatch = {
  opponent: '',
  date: todayIso(),
  warmupTime: '',
  matchTime: '',
  venue: '',
  mapsUrl: '',
  homeAway: 'home',
  notes: '',
}

export function NewMatchPage() {
  const { team, role } = useCurrentTeam()
  const teamPath = useTeamPath()
  const navigate = useNavigate()
  const createMatch = useCreateMatch(team.id)
  const [match, setMatch] = useState<NewMatch>(EMPTY_MATCH)

  if (!hasRole(role, 'assistant'))
    return <PageMessage>No tienes acceso a esta sección.</PageMessage>

  const update = (changes: Partial<NewMatch>) => setMatch({ ...match, ...changes })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    createMatch.mutate(
      {
        ...match,
        opponent: match.opponent.trim(),
        venue: match.venue.trim(),
        notes: match.notes.trim(),
      },
      { onSuccess: (id) => navigate(teamPath(`partidos/${id}`)) },
    )
  }

  return (
    <section className="max-w-xl space-y-4">
      <Link to={teamPath('partidos')} className="text-sm font-medium text-blue-800">
        ← Calendario
      </Link>
      <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">Nuevo partido</h1>

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <label className={`col-span-2 ${LABEL_CLASS}`}>
            <span className={LABEL_TEXT_CLASS}>Rival</span>
            <input
              className={INPUT_CLASS}
              value={match.opponent}
              onChange={(e) => update({ opponent: e.target.value })}
              required
            />
          </label>
          <label className={`col-span-2 ${LABEL_CLASS}`}>
            <span className={LABEL_TEXT_CLASS}>Fecha</span>
            <input
              className={INPUT_CLASS}
              type="date"
              value={match.date}
              onChange={(e) => update({ date: e.target.value })}
              required
            />
          </label>
          <label className={LABEL_CLASS}>
            <span className={LABEL_TEXT_CLASS}>Calentamiento</span>
            <input
              className={INPUT_CLASS}
              type="time"
              value={match.warmupTime}
              onChange={(e) => update({ warmupTime: e.target.value })}
            />
          </label>
          <label className={LABEL_CLASS}>
            <span className={LABEL_TEXT_CLASS}>Partido</span>
            <input
              className={INPUT_CLASS}
              type="time"
              value={match.matchTime}
              onChange={(e) => update({ matchTime: e.target.value })}
            />
          </label>
          <label className={`col-span-2 ${LABEL_CLASS}`}>
            <span className={LABEL_TEXT_CLASS}>Pabellón</span>
            <input
              className={INPUT_CLASS}
              value={match.venue}
              onChange={(e) => update({ venue: e.target.value })}
            />
          </label>
          <fieldset className="col-span-2">
            <legend className={LABEL_TEXT_CLASS}>Juega</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['home', 'away'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ homeAway: value })}
                  className={`rounded-xl py-2.5 text-sm font-semibold ring-1 ${
                    match.homeAway === value
                      ? 'bg-blue-800 text-white ring-blue-800'
                      : 'bg-white text-slate-700 ring-slate-300'
                  }`}
                >
                  {value === 'home' ? 'Local' : 'Visitante'}
                </button>
              ))}
            </div>
          </fieldset>
          <label className={`col-span-2 ${LABEL_CLASS}`}>
            <span className={LABEL_TEXT_CLASS}>Notas (opcional)</span>
            <textarea
              className={INPUT_CLASS}
              rows={2}
              value={match.notes}
              onChange={(e) => update({ notes: e.target.value })}
            />
          </label>
          {createMatch.isError && (
            <p className={`col-span-2 ${ERROR_CLASS}`}>No se ha podido guardar el partido.</p>
          )}
          <button
            type="submit"
            disabled={createMatch.isPending}
            className={`col-span-2 ${PRIMARY_BUTTON_CLASS}`}
          >
            {createMatch.isPending ? 'Guardando…' : 'Crear partido'}
          </button>
        </form>
      </Card>
    </section>
  )
}
