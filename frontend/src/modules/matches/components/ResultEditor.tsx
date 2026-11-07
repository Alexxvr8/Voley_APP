// Staff editor for the match result: points per set (up to 5). Saving marks the match as played.
import { useState } from 'react'
import { resultSummary } from '@/shared/domain/results'
import type { SetScore } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { ERROR_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '@/shared/ui/form'

const MAX_SETS = 5
const SCORE_CLASS =
  'w-16 rounded-lg border border-slate-300 bg-white px-2 py-2 text-center text-base'

interface ResultEditorProps {
  saved: SetScore[]
  busy: boolean
  failed: boolean
  onSave: (sets: SetScore[]) => void
}

/** Text inputs per set; a set row is only kept when both scores are filled in. */
type DraftSet = { us: string; them: string }

function toDraft(sets: SetScore[]): DraftSet[] {
  return sets.length
    ? sets.map((set) => ({ us: String(set.us), them: String(set.them) }))
    : [{ us: '', them: '' }]
}

function toSets(draft: DraftSet[]): SetScore[] {
  return draft
    .filter((set) => set.us !== '' && set.them !== '')
    .map((set) => ({ us: Number(set.us), them: Number(set.them) }))
}

export function ResultEditor({ saved, busy, failed, onSave }: ResultEditorProps) {
  const [draft, setDraft] = useState<DraftSet[]>(toDraft(saved))
  const sets = toSets(draft)

  function change(index: number, side: keyof DraftSet, value: string) {
    if (value !== '' && (Number(value) < 0 || Number(value) > 99)) return
    setDraft(draft.map((set, i) => (i === index ? { ...set, [side]: value } : set)))
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold">Resultado</p>
        {sets.length > 0 && (
          <span className="text-sm font-semibold text-slate-700">{resultSummary(sets)}</span>
        )}
      </div>

      <div className="grid grid-cols-[auto_auto_auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
        <span />
        <span className="text-center text-xs font-semibold text-slate-500">Nosotros</span>
        <span className="text-center text-xs font-semibold text-slate-500">Rival</span>
        <span />
        {draft.map((set, index) => (
          <div key={index} className="contents">
            <span className="font-semibold text-slate-700">Set {index + 1}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              value={set.us}
              onChange={(e) => change(index, 'us', e.target.value)}
              aria-label={`Set ${index + 1}, nuestros puntos`}
              className={SCORE_CLASS}
            />
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={99}
              value={set.them}
              onChange={(e) => change(index, 'them', e.target.value)}
              aria-label={`Set ${index + 1}, puntos del rival`}
              className={SCORE_CLASS}
            />
            {draft.length > 1 && index === draft.length - 1 ? (
              <button
                type="button"
                onClick={() => setDraft(draft.slice(0, -1))}
                className="justify-self-start text-xs font-medium text-rose-700 underline"
              >
                Quitar
              </button>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>

      {draft.length < MAX_SETS && (
        <button
          type="button"
          onClick={() => setDraft([...draft, { us: '', them: '' }])}
          className="text-sm font-medium text-blue-800 underline"
        >
          + Añadir set
        </button>
      )}

      {failed && <p className={ERROR_CLASS}>No se ha podido guardar el resultado.</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || sets.length === 0}
          onClick={() => onSave(sets)}
          className={PRIMARY_BUTTON_CLASS}
        >
          {busy ? 'Guardando…' : 'Guardar resultado'}
        </button>
        {saved.length > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setDraft(toDraft([]))
              onSave([])
            }}
            className={SECONDARY_BUTTON_CLASS}
          >
            Borrar resultado
          </button>
        )}
      </div>
    </Card>
  )
}
