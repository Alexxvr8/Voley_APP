// Staff editor for the match result: the match format, then either the final score in one tap or the
// points of each set. Saving marks the match as played.
import { useState } from 'react'
import {
  MAX_SETS,
  SETS_FORMATS,
  SETS_FORMAT_LABELS,
  hasResult,
  matchScore,
  possibleScores,
  resultSummary,
} from '@/shared/domain/results'
import type { FinalScore, Match, SetsFormat } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { ERROR_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '@/shared/ui/form'
import type { MatchResultInput } from '../api'
import { isValidPoints, toDraft, toSets, type DraftSet } from '../resultDraft'

const SCORE_CLASS =
  'w-16 rounded-lg border border-slate-300 bg-white px-2 py-2 text-center text-base'

type Mode = 'score' | 'points'

interface ResultEditorProps {
  match: Pick<Match, 'setsFormat' | 'setsResult' | 'finalScore'>
  busy: boolean
  failed: boolean
  onSave: (result: MatchResultInput) => void
}

function chipClass(selected: boolean): string {
  return `rounded-full px-3 py-1.5 text-sm font-semibold ${
    selected ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
  }`
}

function sameScore(a: FinalScore | null, b: FinalScore): boolean {
  return a !== null && a.us === b.us && a.them === b.them
}

export function ResultEditor({ match, busy, failed, onSave }: ResultEditorProps) {
  const [format, setFormat] = useState<SetsFormat>(match.setsFormat)
  const [mode, setMode] = useState<Mode>(match.setsResult.length ? 'points' : 'score')
  const [draft, setDraft] = useState<DraftSet[]>(toDraft(match.setsResult))
  const savedScore = match.finalScore
  const maxSets = MAX_SETS[format]
  const sets = toSets(draft)

  function changeFormat(next: SetsFormat) {
    setFormat(next)
    setDraft((rows) => rows.slice(0, MAX_SETS[next]))
  }

  function changePoints(index: number, side: keyof DraftSet, value: string) {
    if (!isValidPoints(value)) return
    setDraft(draft.map((set, i) => (i === index ? { ...set, [side]: value } : set)))
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold">Resultado</p>
        {hasResult(match) && (
          <span className="text-sm font-semibold text-slate-700">{resultSummary(match)}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Formato del partido">
        {SETS_FORMATS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => changeFormat(option)}
            aria-pressed={format === option}
            className={chipClass(format === option)}
          >
            {SETS_FORMAT_LABELS[option]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        {(['score', 'points'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMode(option)}
            aria-pressed={mode === option}
            className={`rounded-lg py-2 ${mode === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            {option === 'score' ? 'Solo marcador' : 'Puntos por set'}
          </button>
        ))}
      </div>

      {mode === 'score' ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Toca el resultado (nosotros - rival) para guardarlo.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {possibleScores(format).map((score) => {
              const selected = sameScore(savedScore, score) && match.setsFormat === format
              const won = score.us > score.them
              return (
                <button
                  key={`${score.us}-${score.them}`}
                  type="button"
                  disabled={busy}
                  onClick={() => onSave({ format, sets: [], finalScore: score })}
                  aria-pressed={selected}
                  className={`rounded-xl py-3 text-base font-bold disabled:opacity-60 ${
                    selected
                      ? 'bg-blue-800 text-white'
                      : won
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  {score.us}-{score.them}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[auto_auto_auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
            <span />
            <span className="text-center text-xs font-semibold text-slate-500">Nosotros</span>
            <span className="text-center text-xs font-semibold text-slate-500">Rival</span>
            <span />
            {draft.map((set, index) => (
              <div key={index} className="contents">
                <span className="font-semibold text-slate-700">Set {index + 1}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={set.us}
                  onChange={(e) => changePoints(index, 'us', e.target.value)}
                  aria-label={`Set ${index + 1}, nuestros puntos`}
                  className={SCORE_CLASS}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={set.them}
                  onChange={(e) => changePoints(index, 'them', e.target.value)}
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

          {draft.length < maxSets && (
            <button
              type="button"
              onClick={() => setDraft([...draft, { us: '', them: '' }])}
              className="text-sm font-medium text-blue-800 underline"
            >
              + Añadir set
            </button>
          )}

          <button
            type="button"
            disabled={busy || sets.length === 0}
            onClick={() => onSave({ format, sets, finalScore: null })}
            className={`w-full ${PRIMARY_BUTTON_CLASS}`}
          >
            {busy ? 'Guardando…' : 'Guardar puntos'}
          </button>
        </>
      )}

      {failed && <p className={ERROR_CLASS}>No se ha podido guardar el resultado.</p>}
      {matchScore(match) && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setDraft(toDraft([]))
            onSave({ format, sets: [], finalScore: null })
          }}
          className={`w-full ${SECONDARY_BUTTON_CLASS}`}
        >
          Borrar resultado
        </button>
      )}
    </Card>
  )
}
