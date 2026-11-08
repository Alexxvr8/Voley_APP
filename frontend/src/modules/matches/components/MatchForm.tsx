// Match fields form, shared by "Nuevo partido" and "Editar partido": opponent (suggested from the
// team's list or typed), date, 24 h match time, warm-up duration, venue (team list or another), format
// (how many sets) and notes.
import { useState, type FormEvent } from 'react'
import { SETS_FORMATS, SETS_FORMAT_LABELS } from '@/shared/domain/results'
import type { TeamVenue } from '@/shared/domain/types'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '@/shared/ui/form'
import { TimeSelect } from '@/shared/ui/TimeSelect'
import { VenuePicker } from '@/shared/ui/VenuePicker'
import { isValidMapsUrl } from '@/shared/utils/maps'
import { formatDuration } from '@/shared/utils/format'
import type { MatchInput } from '../api'

/** Warm-up choices: none, then every 15 minutes up to 2 hours. */
const WARMUP_OPTIONS = Array.from({ length: 8 }, (_, i) => (i + 1) * 15)

interface MatchFormProps {
  initial: MatchInput
  submitLabel: string
  busy: boolean
  failed: boolean
  venues: TeamVenue[]
  /** Names in the team's opponents list. */
  opponents: string[]
  /** `saveOpponent`: also add the typed opponent to the team's list. */
  onSubmit: (match: MatchInput, saveOpponent: boolean) => void
}

export function MatchForm({
  initial,
  submitLabel,
  busy,
  failed,
  venues,
  opponents,
  onSubmit,
}: MatchFormProps) {
  const [match, setMatch] = useState<MatchInput>(initial)
  const [saveOpponent, setSaveOpponent] = useState(false)
  const update = (changes: Partial<MatchInput>) => setMatch({ ...match, ...changes })
  const badLink = !isValidMapsUrl(match.mapsUrl)
  const newOpponent = match.opponent.trim() !== '' && !opponents.includes(match.opponent.trim())

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (badLink) return
    onSubmit(
      {
        ...match,
        opponent: match.opponent.trim(),
        venue: match.venue.trim(),
        mapsUrl: match.mapsUrl.trim(),
        notes: match.notes.trim(),
      },
      newOpponent && saveOpponent,
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Rival</span>
        <input
          className={INPUT_CLASS}
          list="team-opponents"
          value={match.opponent}
          onChange={(e) => update({ opponent: e.target.value })}
          placeholder={opponents.length ? 'Elige de tu lista o escribe otro' : 'Nombre del rival'}
          autoComplete="off"
          required
        />
        <datalist id="team-opponents">
          {opponents.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </label>
      {newOpponent && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={saveOpponent}
            onChange={(e) => setSaveOpponent(e.target.checked)}
            className="size-4 accent-blue-800"
          />
          Guardar "{match.opponent.trim()}" en la lista de rivales
        </label>
      )}

      <label className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Fecha</span>
        <input
          className={INPUT_CLASS}
          type="date"
          value={match.date}
          onChange={(e) => update({ date: e.target.value })}
          required
        />
      </label>

      <div className="flex flex-wrap gap-4">
        <div className={LABEL_CLASS}>
          <span className={LABEL_TEXT_CLASS}>Hora del partido</span>
          <TimeSelect
            value={match.matchTime}
            onChange={(matchTime) => update({ matchTime })}
            step={5}
            label="Hora del partido"
            optional
          />
        </div>
        <label className={LABEL_CLASS}>
          <span className={LABEL_TEXT_CLASS}>Calentamiento</span>
          <select
            className={INPUT_CLASS}
            value={match.warmupMinutes ?? ''}
            onChange={(e) =>
              update({ warmupMinutes: e.target.value ? Number(e.target.value) : null })
            }
          >
            <option value="">Sin indicar</option>
            {WARMUP_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {formatDuration(minutes)} antes
              </option>
            ))}
          </select>
        </label>
      </div>

      <VenuePicker
        venues={venues}
        value={{ venue: match.venue, mapsUrl: match.mapsUrl }}
        onChange={(place) => update({ venue: place.venue, mapsUrl: place.mapsUrl })}
        label="Pabellón"
      />

      <fieldset>
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
      <fieldset>
        <legend className={LABEL_TEXT_CLASS}>Formato</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SETS_FORMATS.map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => update({ setsFormat: format })}
              aria-pressed={match.setsFormat === format}
              className={`rounded-xl py-2.5 text-sm font-semibold ring-1 ${
                match.setsFormat === format
                  ? 'bg-blue-800 text-white ring-blue-800'
                  : 'bg-white text-slate-700 ring-slate-300'
              }`}
            >
              {SETS_FORMAT_LABELS[format]}
            </button>
          ))}
        </div>
      </fieldset>

      <label className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Notas (opcional)</span>
        <textarea
          className={INPUT_CLASS}
          rows={2}
          value={match.notes}
          onChange={(e) => update({ notes: e.target.value })}
        />
      </label>
      {failed && <p className={ERROR_CLASS}>No se ha podido guardar el partido.</p>}
      <button type="submit" disabled={busy || badLink} className={PRIMARY_BUTTON_CLASS}>
        {busy ? 'Guardando…' : submitLabel}
      </button>
    </form>
  )
}
