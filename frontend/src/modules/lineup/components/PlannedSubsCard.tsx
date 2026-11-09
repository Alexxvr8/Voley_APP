// Planned changes of the set, as groups: a normal change (marked with the zone's position, e.g. a
// receiver in for a middle), a change to serve that comes back, or the setter ↔ opposite double
// switch, the only one that changes the rotation (R4 → R1). A small form adds new ones.
import { useState } from 'react'
import { POSITION_SHORT_LABELS } from '@/shared/domain/labels'
import type { Player, Position } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { ChoiceChips } from '@/shared/ui/ChoiceChips'
import { PlayerSelect } from '@/shared/ui/PlayerSelect'
import { playerName } from '@/shared/utils/format'
import { substitutesByFit, type PlannedSub, type SubKind } from '../setPlan'

interface PlannedSubsCardProps {
  subs: PlannedSub[]
  /** Players in the starting lineup (who can leave). */
  onCourt: Player[]
  /** Called-up players not in the lineup nor libero (who can come in). */
  bench: Player[]
  /** Role of a player in the starting lineup, i.e. the position of the change. */
  roleOf: (playerId: string) => Position | undefined
  /** Setter and opposite on court, when the system allows a double switch. */
  doublePair: { setter: Player; opposite: Player } | null
  /** All players, to show names of changes whose players are no longer called up. */
  allPlayers: Player[]
  onChange: (subs: PlannedSub[]) => void
}

const KIND_LABELS: Record<SubKind, string> = {
  normal: 'Cambio',
  serve: 'Al saque',
  double: 'Doble cambio',
}

interface Draft {
  kind: SubKind
  outId: string
  inId: string
  /** Double switch: bench opposite for the setter, bench setter for the opposite. */
  inForSetter: string
  inForOpposite: string
  note: string
}

const EMPTY_DRAFT: Draft = {
  kind: 'normal',
  outId: '',
  inId: '',
  inForSetter: '',
  inForOpposite: '',
  note: '',
}

const shortPosition = (player: Player) => `(${POSITION_SHORT_LABELS[player.mainPosition]})`

export function PlannedSubsCard({
  subs,
  onCourt,
  bench,
  roleOf,
  doublePair,
  allPlayers,
  onChange,
}: PlannedSubsCardProps) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const update = (changes: Partial<Draft>) => setDraft({ ...draft, ...changes })

  const byId = (playerId: string) => allPlayers.find((p) => p.id === playerId)
  const nameOf = (playerId: string) => {
    const player = byId(playerId)
    return player ? playerName(player) : '¿?'
  }
  const roleLabel = (playerId: string) => {
    const role = roleOf(playerId)
    return role ? POSITION_SHORT_LABELS[role] : '—'
  }

  const outRole = draft.outId ? roleOf(draft.outId) : undefined
  const incoming = outRole ? substitutesByFit(bench, outRole) : bench
  const canAdd =
    draft.kind === 'double'
      ? Boolean(doublePair && draft.inForSetter && draft.inForOpposite)
      : Boolean(draft.outId && draft.inId)

  function add() {
    const swaps =
      draft.kind === 'double' && doublePair
        ? [
            { outId: doublePair.setter.id, inId: draft.inForSetter },
            { outId: doublePair.opposite.id, inId: draft.inForOpposite },
          ]
        : [{ outId: draft.outId, inId: draft.inId }]
    onChange([...subs, { kind: draft.kind, swaps, note: draft.note.trim() }])
    setDraft({ ...EMPTY_DRAFT, kind: draft.kind })
  }

  const kinds: SubKind[] = doublePair ? ['normal', 'serve', 'double'] : ['normal', 'serve']

  return (
    <Card className="space-y-3">
      <p className="font-semibold">Cambios previstos</p>

      {subs.length === 0 && <p className="text-sm text-slate-500">Sin cambios previstos.</p>}
      {subs.map((sub, index) => (
        <div key={index} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2 text-sm">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-xs font-semibold text-slate-500">
              {KIND_LABELS[sub.kind]}
              {sub.kind === 'double' && ' · cambia la R'}
              {sub.kind === 'serve' && ' · vuelve al perder el saque'}
            </p>
            {sub.swaps.map((swap) => (
              <p key={swap.outId} className="flex flex-wrap items-center gap-x-2">
                <span className="w-7 shrink-0 rounded bg-slate-200 text-center text-xs font-bold text-slate-700">
                  {roleLabel(swap.outId)}
                </span>
                <span className="text-rose-700">↓ {nameOf(swap.outId)}</span>
                <span className="text-emerald-700">
                  ↑ {nameOf(swap.inId)}{' '}
                  <span className="text-xs text-slate-500">
                    {byId(swap.inId) ? shortPosition(byId(swap.inId)!) : ''}
                  </span>
                </span>
              </p>
            ))}
            {sub.note && <p className="text-xs text-slate-500">{sub.note}</p>}
          </div>
          <button
            type="button"
            onClick={() => onChange(subs.filter((_, i) => i !== index))}
            className="px-1 text-slate-400"
            aria-label="Quitar cambio"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
        <ChoiceChips
          label="Tipo de cambio"
          columns={kinds.length as 2 | 3}
          choices={kinds.map((kind) => ({ value: kind, label: KIND_LABELS[kind] }))}
          value={draft.kind}
          onChange={(kind) => setDraft({ ...EMPTY_DRAFT, kind, note: draft.note })}
        />

        {draft.kind === 'double' && doublePair ? (
          <>
            <p className="text-xs text-slate-500">
              Sale la colocadora y la opuesta a la vez y entran una opuesta y una colocadora: la
              colocadora nueva coloca desde la zona de la opuesta (p. ej. R4 → R1).
            </p>
            <DoubleRow
              title="Sale Co"
              leaving={doublePair.setter}
              options={substitutesByFit(bench, 'opposite')}
              value={draft.inForSetter}
              onChange={(inForSetter) => update({ inForSetter })}
              placeholder="Entra Op…"
            />
            <DoubleRow
              title="Sale Op"
              leaving={doublePair.opposite}
              options={substitutesByFit(
                bench.filter((p) => p.id !== draft.inForSetter),
                'setter',
              )}
              value={draft.inForOpposite}
              onChange={(inForOpposite) => update({ inForOpposite })}
              placeholder="Entra Co…"
            />
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <PlayerSelect
              players={onCourt}
              value={draft.outId || undefined}
              onChange={(outId) => update({ outId: outId ?? '', inId: '' })}
              placeholder="Sale…"
              describe={(player) => `(${roleLabel(player.id)})`}
            />
            <PlayerSelect
              players={incoming}
              value={draft.inId || undefined}
              onChange={(inId) => update({ inId: inId ?? '' })}
              placeholder="Entra…"
              describe={shortPosition}
            />
            {outRole && (
              <p className="col-span-2 text-xs text-slate-500">
                Cambio de {POSITION_SHORT_LABELS[outRole]}: quien entra juega esa zona; la R no
                cambia.
                {draft.kind === 'serve' &&
                  ' En el partido, "Vuelve" lo deshace al perder el saque.'}
              </p>
            )}
          </div>
        )}

        <input
          value={draft.note}
          onChange={(e) => update({ note: e.target.value })}
          placeholder={
            draft.kind === 'double' ? 'Nota (ej. en R4)' : 'Nota (ej. si falla recepción)'
          }
          className="w-full rounded-lg border border-slate-300 px-2 py-2"
        />
        <button
          type="button"
          disabled={!canAdd}
          onClick={add}
          className="w-full rounded-lg bg-blue-800 py-2 font-semibold text-white disabled:bg-slate-300"
        >
          Añadir {KIND_LABELS[draft.kind].toLowerCase()}
        </button>
      </div>
    </Card>
  )
}

/** One half of the double switch form: who leaves (fixed) and who comes in. */
function DoubleRow({
  title,
  leaving,
  options,
  value,
  onChange,
  placeholder,
}: {
  title: string
  leaving: Player
  options: Player[]
  value: string
  onChange: (playerId: string) => void
  placeholder: string
}) {
  return (
    <div className="grid grid-cols-2 items-center gap-2">
      <p className="text-rose-700">
        <span className="block text-xs font-semibold text-slate-500">{title}</span>↓{' '}
        {playerName(leaving)}
      </p>
      <PlayerSelect
        players={options}
        value={value || undefined}
        onChange={(playerId) => onChange(playerId ?? '')}
        placeholder={placeholder}
        describe={shortPosition}
      />
    </div>
  )
}
