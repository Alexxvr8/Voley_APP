// Staff view: every competing player with their availability answer and a checkbox to call them up.
// The coach can call up anyone, whether they answered or not (spec module 4), and change the
// number and position a called-up player uses in this match.
import { AVAILABILITY_LABELS } from '@/shared/domain/labels'
import { asCalledUp } from '@/shared/domain/callups'
import type { AvailabilityEntry, AvailabilityStatus, Callup, Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { PositionBadge } from '@/shared/ui/PositionBadge'
import { byShirtNumber, playerName, shirtNumber } from '@/shared/utils/format'
import { CallupDetailsEditor } from './CallupDetailsEditor'

const STATUS_STYLES: Record<AvailabilityStatus, string> = {
  yes: 'bg-emerald-100 text-emerald-800',
  no: 'bg-rose-100 text-rose-800',
  maybe: 'bg-amber-100 text-amber-800',
}

interface CallupListProps {
  players: Player[]
  /** Availability answers by player id; players who did not answer are missing. */
  answers: Record<string, AvailabilityEntry>
  callups: Callup[]
  onToggle: (playerId: string) => void
  onChangeDetails: (callup: Callup) => void
}

export function CallupList({
  players,
  answers,
  callups,
  onToggle,
  onChangeDetails,
}: CallupListProps) {
  const byNumber = [...players].sort(byShirtNumber)

  return (
    <Card className="space-y-1">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="font-semibold">Disponibilidad y convocatoria</p>
        <span className="text-sm text-slate-500">{callups.length} convocados</span>
      </div>

      {byNumber.map((rosterPlayer) => {
        const answer = answers[rosterPlayer.id]
        const callup = callups.find((entry) => entry.playerId === rosterPlayer.id)
        // Called-up players show the number and position they use in this match.
        const player = callup ? asCalledUp(rosterPlayer, callup) : rosterPlayer
        return (
          <div key={player.id} className="border-t border-slate-100">
            <label className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={callup !== undefined}
                onChange={() => onToggle(player.id)}
                className="size-5 accent-blue-800"
              />
              <span className="w-6 text-right text-sm font-bold text-slate-400">
                {shirtNumber(player)}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{playerName(player)}</span>
                {answer?.comment && (
                  <span className="block text-xs text-slate-500">{answer.comment}</span>
                )}
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
            {callup && (
              <CallupDetailsEditor
                player={rosterPlayer}
                callup={callup}
                onChange={onChangeDetails}
              />
            )}
          </div>
        )
      })}
    </Card>
  )
}
