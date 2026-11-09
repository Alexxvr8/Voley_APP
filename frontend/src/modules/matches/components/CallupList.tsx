// Staff view: every player who can play this match with their availability answer and a checkbox to
// call them up. Called-up players go to the top, by position; guests show when they come. The coach
// can call up anyone, whether they answered or not (spec module 4), and change the number and
// positions a called-up player uses in this match.
import { AVAILABILITY_LABELS } from '@/shared/domain/labels'
import { MEMBERSHIP_LABELS } from '@/shared/domain/membership'
import type { AvailabilityEntry, AvailabilityStatus, Callup, Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { PositionBadge } from '@/shared/ui/PositionBadge'
import { playerName, shirtNumber } from '@/shared/utils/format'
import { orderCallupList } from '../callupOrder'
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
  onChangeDetails: (
    playerId: string,
    changes: Partial<Pick<Callup, 'number' | 'positions'>>,
  ) => void
}

export function CallupList({
  players,
  answers,
  callups,
  onToggle,
  onChangeDetails,
}: CallupListProps) {
  const entries = orderCallupList(players, callups)

  return (
    <Card className="space-y-1">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="font-semibold">Disponibilidad y convocatoria</p>
        <span className="text-sm text-slate-500">{callups.length} convocados</span>
      </div>

      {entries.map(({ rosterPlayer, player, callup }, index) => {
        const answer = answers[rosterPlayer.id]
        // A label above the first called-up player and above the first one who is not.
        const startsGroup = index === 0 || Boolean(entries[index - 1].callup) !== Boolean(callup)
        return (
          <div
            key={player.id}
            className={`border-t border-slate-100 ${callup ? '-mx-2 rounded-lg bg-blue-50/60 px-2' : ''}`}
          >
            {startsGroup && (
              <p className="pt-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                {callup ? 'Convocados' : 'Sin convocar'}
              </p>
            )}
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
                <span className="block text-sm font-medium">
                  {playerName(player)}
                  {player.membership !== 'member' && (
                    <span className="ml-1.5 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-800">
                      {MEMBERSHIP_LABELS[player.membership]}
                    </span>
                  )}
                </span>
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
                onChange={(changes) => onChangeDetails(player.id, changes)}
              />
            )}
          </div>
        )
      })}
    </Card>
  )
}
