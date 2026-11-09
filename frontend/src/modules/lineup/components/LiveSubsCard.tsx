// Planned changes during the match. Each group has its next step as a big button ("Hacer cambio",
// "Entra al saque" → "Vuelve", "Hacer doble cambio" → "Deshacer doble cambio") and ↺ to undo.
import type { Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { SUB_STEP_COUNT, type PlannedSub } from '../setPlan'
import { shortName } from '@/shared/utils/format'

interface LiveSubsCardProps {
  subs: PlannedSub[]
  /** Steps done of each change, by index. */
  stepsDone: Partial<Record<number, number>>
  playersById: Map<string, Player>
  onAdvance: (index: number) => void
  onUndo: (index: number) => void
}

function label(player: Player | undefined): string {
  return player ? `${player.number ?? '–'} ${shortName(player)}` : '¿?'
}

/** Text of the next step's button, by kind and steps done. */
function nextStepLabel(sub: PlannedSub, done: number): string {
  if (sub.kind === 'serve') return done === 0 ? 'Entra al saque' : 'Vuelve'
  if (sub.kind === 'double') return done === 0 ? 'Hacer doble cambio' : 'Deshacer doble cambio'
  return 'Hacer cambio'
}

const TITLES = { normal: '', serve: 'Al saque', double: 'Doble cambio · cambia la R' }

export function LiveSubsCard({
  subs,
  stepsDone,
  playersById,
  onAdvance,
  onUndo,
}: LiveSubsCardProps) {
  return (
    <Card className="space-y-2">
      <p className="font-semibold">Cambios previstos</p>
      {subs.length === 0 && (
        <p className="text-sm text-slate-500">Sin cambios previstos en este set.</p>
      )}
      {subs.map((sub, index) => {
        const done = stepsDone[index] ?? 0
        const finished = done >= SUB_STEP_COUNT[sub.kind]
        // In to serve, or double switch on: waiting for its second step.
        const inEffect = done === 1 && sub.kind !== 'normal'
        return (
          <div key={index} className="flex items-center gap-3 border-t border-slate-100 pt-2">
            <div className={`min-w-0 flex-1 ${finished ? 'text-slate-400' : ''}`}>
              {(TITLES[sub.kind] || inEffect) && (
                <p className="text-xs font-semibold text-slate-500">
                  {TITLES[sub.kind]}
                  {inEffect && <span className="ml-1 text-amber-700">· en juego</span>}
                </p>
              )}
              {sub.swaps.map((swap) => (
                <p key={swap.outId} className={`font-semibold ${finished ? 'line-through' : ''}`}>
                  {label(playersById.get(swap.outId))} → {label(playersById.get(swap.inId))}
                </p>
              ))}
              {sub.note && <p className="text-xs text-slate-500">{sub.note}</p>}
            </div>
            {done > 0 && (
              <button
                type="button"
                onClick={() => onUndo(index)}
                aria-label="Deshacer el último paso"
                className="shrink-0 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600"
              >
                ↺
              </button>
            )}
            {!finished && (
              <button
                type="button"
                onClick={() => onAdvance(index)}
                className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-white ${
                  done === 0 ? 'bg-emerald-600' : 'bg-amber-600'
                }`}
              >
                {nextStepLabel(sub, done)}
              </button>
            )}
          </div>
        )
      })}
    </Card>
  )
}
