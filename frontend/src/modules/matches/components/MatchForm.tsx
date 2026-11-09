// Match fields form, shared by "Nuevo partido" and "Editar partido": opponent (typed, or tapped from
// the team's list), date, 24 h match time, warm-up, venue (team list or another), home/away, format
// (how many sets) and notes. Short choices are buttons, not dropdowns.
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
import { ChoiceChips } from '@/shared/ui/ChoiceChips'
import { DatePicker } from '@/shared/ui/DatePicker'
import { TimeSelect } from '@/shared/ui/TimeSelect'
import { VenuePicker } from '@/shared/ui/VenuePicker'
import { isValidMapsUrl } from '@/shared/utils/maps'
import { formatDuration } from '@/shared/utils/format'
import type { MatchInput } from '../api'

/** Warm-up choices: none, then every 15 minutes up to 2 hours (0 = not set). */
const WARMUP_CHOICES = [
  { value: 0, label: 'No' },
  ...Array.from({ length: 8 }, (_, i) => ({
    value: (i + 1) * 15,
    label: formatDuration((i + 1) * 15).replace(' min', '′'),
  })),
]

/** Saved opponents shown as buttons: all of them, or the ones matching what is being typed. */
function suggestedOpponents(opponents: string[], typed: string): string[] {
  const text = typed.trim().toLowerCase()
  if (!text || opponents.some((name) => name.toLowerCase() === text)) return opponents
  return opponents.filter((name) => name.toLowerCase().includes(text))
}

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
      <div className={LABEL_CLASS}>
        <label className={LABEL_CLASS}>
          <span className={LABEL_TEXT_CLASS}>Rival</span>
          <input
            className={INPUT_CLASS}
            value={match.opponent}
            onChange={(e) => update({ opponent: e.target.value })}
            placeholder={
              opponents.length ? 'Toca uno de tu lista o escribe otro' : 'Nombre del rival'
            }
            autoComplete="off"
            required
          />
        </label>
        {opponents.length > 0 && (
          <ChoiceChips
            label="Rivales de tu lista"
            choices={suggestedOpponents(opponents, match.opponent).map((name) => ({
              value: name,
              label: name,
            }))}
            value={match.opponent.trim()}
            onChange={(opponent) => update({ opponent })}
          />
        )}
      </div>
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

      <div className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Fecha</span>
        <DatePicker
          value={match.date}
          onChange={(date) => update({ date })}
          label="Fecha del partido"
        />
      </div>

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
      <div className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Calentamiento (antes del partido)</span>
        <ChoiceChips
          label="Calentamiento"
          columns={5}
          choices={WARMUP_CHOICES}
          value={match.warmupMinutes ?? 0}
          onChange={(minutes) => update({ warmupMinutes: minutes || null })}
        />
      </div>

      <VenuePicker
        venues={venues}
        value={{ venue: match.venue, mapsUrl: match.mapsUrl }}
        onChange={(place) => update({ venue: place.venue, mapsUrl: place.mapsUrl })}
        label="Pabellón"
      />

      <div className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Juega</span>
        <ChoiceChips
          label="Juega"
          columns={2}
          choices={[
            { value: 'home', label: 'Local' },
            { value: 'away', label: 'Visitante' },
          ]}
          value={match.homeAway}
          onChange={(homeAway) => update({ homeAway })}
        />
      </div>
      <div className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Formato</span>
        <ChoiceChips
          label="Formato"
          columns={4}
          choices={SETS_FORMATS.map((format) => ({
            value: format,
            label: SETS_FORMAT_LABELS[format],
          }))}
          value={match.setsFormat}
          onChange={(setsFormat) => update({ setsFormat })}
        />
      </div>

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
