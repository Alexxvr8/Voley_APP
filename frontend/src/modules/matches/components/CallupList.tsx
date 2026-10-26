// Staff view: every player with their availability answer and a checkbox to call them up.
// The coach can call up anyone, whether they answered or not (SPEC module 4).
import { AVAILABILITY_LABELS } from '@/shared/domain/labels'
import type { AvailabilityEntry, AvailabilityStatus, Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { PositionBadge } from '@/shared/ui/PositionBadge'
import { playerName } from '@/shared/utils/format'

const STATUS_STYLES: Record<AvailabilityStatus, string> = {
  yes: 'bg-emerald-100 text-emerald-800',
  no: 'bg-rose-100 text-rose-800',
  maybe: 'bg-amber-100 text-amber-800',
}

interface CallupListProps {
  players: Player[]
  /** Availability answers by player id; players who did not answer are missing. */
  answers: Record<string, AvailabilityEntry>
  calledUpIds: string[]
  onToggle: (playerId: string) => void
}

export function CallupList({ players, answers, calledUpIds, onToggle }: CallupListProps) {
  const byNumber = [...players].sort((a, b) => a.number - b.number)

  return (
    <Card className="space-y-1">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="font-semibold">Disponibilidad y convocatoria</p>
        <span className="text-sm text-slate-500">{calledUpIds.length} convocados</span>
      </div>

      {byNumber.map((player) => {
        const answer = answers[player.id]
        return (
          <label key={player.id} className="flex items-center gap-3 border-t border-slate-100 py-2">
            <input
              type="checkbox"
              checked={calledUpIds.includes(player.id)}
              onChange={() => onToggle(player.id)}
              className="size-5 accent-blue-800"
            />
            <span className="w-6 text-right text-sm font-bold text-slate-400">{player.number}</span>
            <span className="flex-1">
              <span className="block text-sm font-medium">{playerName(player)}</span>
              {answer?.comment && <span className="block text-xs text-slate-500">{answer.comment}</span>}
            </span>
            <PositionBadge position={player.mainPosition} short />
            <span
              className={`w-16 rounded-full py-0.5 text-center text-xs font-semibold ${
                answer ? STATUS_STYLES[answer.status] : 'bg-slate-100 text-slate-500'
              }`}
            >
              {answer ? AVAILABILITY_LABELS[answer.status] : '—'}
            </span>
          </label>
        )
      })}
    </Card>
  )
}
