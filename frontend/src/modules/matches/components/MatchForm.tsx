// Match fields form, shared by "Nuevo partido" and "Editar partido". Includes the Google Maps link.
import { useState, type FormEvent } from 'react'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '@/shared/ui/form'
import { isMapsLink } from '@/shared/utils/maps'
import type { MatchInput } from '../api'

interface MatchFormProps {
  initial: MatchInput
  submitLabel: string
  busy: boolean
  failed: boolean
  onSubmit: (match: MatchInput) => void
}

export function MatchForm({ initial, submitLabel, busy, failed, onSubmit }: MatchFormProps) {
  const [match, setMatch] = useState<MatchInput>(initial)
  const update = (changes: Partial<MatchInput>) => setMatch({ ...match, ...changes })
  const badLink = match.mapsUrl.trim() !== '' && !isMapsLink(match.mapsUrl)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (badLink) return
    onSubmit({
      ...match,
      opponent: match.opponent.trim(),
      venue: match.venue.trim(),
      mapsUrl: match.mapsUrl.trim(),
      notes: match.notes.trim(),
    })
  }

  return (
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
      <label className={`col-span-2 ${LABEL_CLASS}`}>
        <span className={LABEL_TEXT_CLASS}>Enlace de Google Maps (opcional)</span>
        <input
          className={INPUT_CLASS}
          type="url"
          inputMode="url"
          value={match.mapsUrl}
          onChange={(e) => update({ mapsUrl: e.target.value })}
          placeholder="https://maps.app.goo.gl/…"
        />
        <span className="text-xs text-slate-500">
          En Google Maps: Compartir → Copiar enlace. Si no pones enlace, el mapa busca el nombre del
          pabellón.
        </span>
      </label>
      {badLink && <p className={`col-span-2 ${ERROR_CLASS}`}>Ese enlace no es de Google Maps.</p>}
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
      {failed && <p className={`col-span-2 ${ERROR_CLASS}`}>No se ha podido guardar el partido.</p>}
      <button
        type="submit"
        disabled={busy || badLink}
        className={`col-span-2 ${PRIMARY_BUTTON_CLASS}`}
      >
        {busy ? 'Guardando…' : submitLabel}
      </button>
    </form>
  )
}
