// List of planned substitutions for the set, with a small form to add new ones.
// First you pick who leaves; then only players who can cover that position are offered.
import { useState } from 'react'
import type { Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { PlayerSelect } from '@/shared/ui/PlayerSelect'
import { playerName } from '@/shared/utils/format'
import type { PlannedSub } from '../setPlan'

interface PlannedSubsCardProps {
  subs: PlannedSub[]
  /** Players who can leave the court. */
  onCourt: Player[]
  /** Bench players allowed to replace the given player (same position, or setter ↔ opposite). */
  substitutesFor: (outId: string) => Player[]
  /** All players, to show names of subs whose players are no longer on court or bench. */
  allPlayers: Player[]
  onChange: (subs: PlannedSub[]) => void
}

const EMPTY_DRAFT: PlannedSub = { outId: '', inId: '', note: '' }

export function PlannedSubsCard({ subs, onCourt, substitutesFor, allPlayers, onChange }: PlannedSubsCardProps) {
  // The substitution being typed in the form; only added to the plan when confirmed.
  const [draft, setDraft] = useState<PlannedSub>(EMPTY_DRAFT)

  const nameOf = (playerId: string) => {
    const player = allPlayers.find((p) => p.id === playerId)
    return player ? playerName(player) : ''
  }

  function chooseOutgoing(outId: string | undefined) {
    // A different outgoing player may need a different position, so the incoming one resets.
    setDraft({ ...draft, outId: outId ?? '', inId: '' })
  }

  function addDraft() {
    onChange([...subs, draft])
    setDraft(EMPTY_DRAFT)
  }

  function removeSub(index: number) {
    onChange(subs.filter((_, i) => i !== index))
  }

  return (
    <Card className="space-y-3">
      <p className="font-semibold">Cambios previstos</p>

      {subs.length === 0 && <p className="text-sm text-slate-500">Sin cambios previstos.</p>}
      {subs.map((sub, index) => (
        <div key={index} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2 text-sm">
          <div className="flex-1">
            <p>
              <span className="text-rose-700">↓ {nameOf(sub.outId)}</span>
              {'  '}
              <span className="text-emerald-700">↑ {nameOf(sub.inId)}</span>
            </p>
            {sub.note && <p className="text-xs text-slate-500">{sub.note}</p>}
          </div>
          <button type="button" onClick={() => removeSub(index)} className="px-1 text-slate-400" aria-label="Quitar cambio">
            ✕
          </button>
        </div>
      ))}

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-sm">
        <PlayerSelect players={onCourt} value={draft.outId || undefined} onChange={chooseOutgoing} placeholder="Sale…" />
        <PlayerSelect
          players={draft.outId ? substitutesFor(draft.outId) : []}
          value={draft.inId || undefined}
          onChange={(id) => setDraft({ ...draft, inId: id ?? '' })}
          placeholder={draft.outId ? 'Entra…' : 'Elige antes quién sale'}
        />
        <input
          value={draft.note}
          onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          placeholder="Nota (ej. si falla recepción)"
          className="col-span-2 rounded-lg border border-slate-300 px-2 py-2"
        />
        <button
          type="button"
          disabled={!draft.outId || !draft.inId}
          onClick={addDraft}
          className="col-span-2 rounded-lg bg-blue-800 py-2 font-semibold text-white disabled:bg-slate-300"
        >
          Añadir cambio
        </button>
      </div>
    </Card>
  )
}
