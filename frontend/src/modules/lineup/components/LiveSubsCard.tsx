// Planned substitutions during the match: "Hacer cambio" swaps the players on the court, "Deshacer"
// puts them back.
import type { Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import type { PlannedSub } from '../setPlan'

interface LiveSubsCardProps {
  subs: PlannedSub[]
  done: number[]
  playersById: Map<string, Player>
  onToggle: (index: number) => void
}

function label(player: Player | undefined): string {
  return player ? `${player.number ?? '–'} ${player.firstName}` : '¿?'
}

export function LiveSubsCard({ subs, done, playersById, onToggle }: LiveSubsCardProps) {
  return (
    <Card className="space-y-2">
      <p className="font-semibold">Cambios previstos</p>
      {subs.length === 0 && (
        <p className="text-sm text-slate-500">Sin cambios previstos en este set.</p>
      )}
      {subs.map((sub, index) => {
        const isDone = done.includes(index)
        return (
          <div key={index} className="flex items-center gap-3 border-t border-slate-100 pt-2">
            <div className={`min-w-0 flex-1 ${isDone ? 'text-slate-400 line-through' : ''}`}>
              <p className="font-semibold">
                {label(playersById.get(sub.outId))} → {label(playersById.get(sub.inId))}
              </p>
              {sub.note && <p className="text-xs text-slate-500">{sub.note}</p>}
            </div>
            <button
              type="button"
              onClick={() => onToggle(index)}
              className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${
                isDone ? 'bg-slate-100 text-slate-700' : 'bg-emerald-600 text-white'
              }`}
            >
              {isDone ? 'Deshacer' : 'Hacer cambio'}
            </button>
          </div>
        )
      })}
    </Card>
  )
}
