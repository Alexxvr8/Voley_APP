import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { SYSTEM_LABELS } from '@/shared/domain/labels'
import type { GameSystem } from '@/shared/domain/types'
import { matches, players, team } from '@/shared/mock/data'
import { useMockStore } from '@/shared/mock/store'
import { Card } from '@/shared/ui/Card'
import { formatShortDate, playerName } from '@/shared/utils/format'
import { Court } from './Court'
import { SYSTEMS, type Zone } from './systems'

interface PlannedSub {
  outId: string
  inId: string
  note: string
}

interface SetPlan {
  system: GameSystem
  rotation: Partial<Record<Zone, string>>
  liberoId?: string
  liberoReplacesId?: string
  subs: PlannedSub[]
}

const SET_NUMBERS = [1, 2, 3, 4, 5]

export function SetPlanPage() {
  const { matchId } = useParams()
  const match = matchId ? matches.find((m) => m.id === matchId) : [...matches].sort((a, b) => a.date.localeCompare(b.date))[0]
  const { callups } = useMockStore()

  const [currentSet, setCurrentSet] = useState(1)
  const [plans, setPlans] = useState<Record<number, SetPlan>>({})
  const [showAll, setShowAll] = useState(false)
  const [draftSub, setDraftSub] = useState<PlannedSub>({ outId: '', inId: '', note: '' })

  if (!match) return <p className="py-12 text-center text-slate-500">Partido no encontrado.</p>

  const calledUp = players.filter((p) => (callups[match.id] ?? []).includes(p.id))
  const byId = (id: string | undefined) => players.find((p) => p.id === id)

  // A new set starts from the previous set's system, or the team default (SPEC module 5).
  const plan: SetPlan = plans[currentSet] ?? {
    system: plans[currentSet - 1]?.system ?? team.defaultSystem,
    rotation: {},
    subs: [],
  }
  const updatePlan = (changes: Partial<SetPlan>) => setPlans({ ...plans, [currentSet]: { ...plan, ...changes } })

  const onCourtIds = Object.values(plan.rotation)
  const onCourt = calledUp.filter((p) => onCourtIds.includes(p.id))
  const bench = calledUp.filter((p) => !onCourtIds.includes(p.id) && p.id !== plan.liberoId)
  const liberoCandidates = calledUp.filter(
    (p) => !onCourtIds.includes(p.id) && (showAll || p.mainPosition === 'libero' || p.otherPositions.includes('libero')),
  )
  const otherPlannedSets = SET_NUMBERS.filter((n) => n !== currentSet && plans[n])

  return (
    <section className="space-y-4">
      <div>
        <Link to={`/partidos/${match.id}`} className="text-sm font-medium text-blue-800">
          ← Partido
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-900">Plan vs {match.opponent}</h1>
        <p className="text-sm capitalize text-slate-500">
          {formatShortDate(match.date)} · {calledUp.length} convocados
        </p>
      </div>

      <div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-200 p-1">
        {SET_NUMBERS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setCurrentSet(n)}
            className={`rounded-lg py-2 text-sm font-semibold ${
              n === currentSet ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Set {n}
            {plans[n] && n !== currentSet ? ' •' : ''}
          </button>
        ))}
      </div>

      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-slate-500">Sistema</span>
            <select
              value={plan.system}
              onChange={(e) => updatePlan({ system: e.target.value as GameSystem })}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 font-medium"
            >
              {SYSTEMS.map((s) => (
                <option key={s} value={s}>
                  {SYSTEM_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          {otherPlannedSets.length > 0 && (
            <label className="text-sm">
              <span className="mb-1 block text-slate-500">Copiar de</span>
              <select
                value=""
                onChange={(e) => setPlans({ ...plans, [currentSet]: structuredClone(plans[Number(e.target.value)]) })}
                className="rounded-lg border border-slate-300 bg-white px-2 py-2 font-medium"
              >
                <option value="">—</option>
                {otherPlannedSets.map((n) => (
                  <option key={n} value={n}>
                    Set {n}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <Court
          system={plan.system}
          rotation={plan.rotation}
          candidates={calledUp}
          showAll={showAll}
          onAssign={(zone, playerId) => updatePlan({ rotation: { ...plan.rotation, [zone]: playerId } })}
        />

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="size-4 accent-blue-800"
          />
          Mostrar todos los convocados en cada zona
        </label>
      </Card>

      <Card className="space-y-2">
        <p className="font-semibold">Líbero</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label>
            <span className="mb-1 block text-slate-500">Entra</span>
            <select
              value={plan.liberoId ?? ''}
              onChange={(e) => updatePlan({ liberoId: e.target.value || undefined })}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2"
            >
              <option value="">—</option>
              {liberoCandidates.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.number}. {p.firstName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-slate-500">Por</span>
            <select
              value={plan.liberoReplacesId ?? ''}
              onChange={(e) => updatePlan({ liberoReplacesId: e.target.value || undefined })}
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2"
            >
              <option value="">—</option>
              {onCourt.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.number}. {p.firstName}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="font-semibold">Cambios previstos</p>
        {plan.subs.length === 0 && <p className="text-sm text-slate-500">Sin cambios previstos.</p>}
        {plan.subs.map((sub, index) => (
          <div key={index} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2 text-sm">
            <div className="flex-1">
              <p>
                <span className="text-rose-700">↓ {byId(sub.outId) && playerName(byId(sub.outId)!)}</span>
                {'  '}
                <span className="text-emerald-700">↑ {byId(sub.inId) && playerName(byId(sub.inId)!)}</span>
              </p>
              {sub.note && <p className="text-xs text-slate-500">{sub.note}</p>}
            </div>
            <button
              type="button"
              onClick={() => updatePlan({ subs: plan.subs.filter((_, i) => i !== index) })}
              className="px-1 text-slate-400"
              aria-label="Quitar cambio"
            >
              ✕
            </button>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-sm">
          <select
            value={draftSub.outId}
            onChange={(e) => setDraftSub({ ...draftSub, outId: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-2 py-2"
          >
            <option value="">Sale…</option>
            {onCourt.map((p) => (
              <option key={p.id} value={p.id}>
                {p.number}. {p.firstName}
              </option>
            ))}
          </select>
          <select
            value={draftSub.inId}
            onChange={(e) => setDraftSub({ ...draftSub, inId: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-2 py-2"
          >
            <option value="">Entra…</option>
            {bench.map((p) => (
              <option key={p.id} value={p.id}>
                {p.number}. {p.firstName}
              </option>
            ))}
          </select>
          <input
            value={draftSub.note}
            onChange={(e) => setDraftSub({ ...draftSub, note: e.target.value })}
            placeholder="Nota (ej. si falla recepción)"
            className="col-span-2 rounded-lg border border-slate-300 px-2 py-2"
          />
          <button
            type="button"
            disabled={!draftSub.outId || !draftSub.inId}
            onClick={() => {
              updatePlan({ subs: [...plan.subs, draftSub] })
              setDraftSub({ outId: '', inId: '', note: '' })
            }}
            className="col-span-2 rounded-lg bg-blue-800 py-2 font-semibold text-white disabled:bg-slate-300"
          >
            Añadir cambio
          </button>
        </div>
      </Card>
    </section>
  )
}
