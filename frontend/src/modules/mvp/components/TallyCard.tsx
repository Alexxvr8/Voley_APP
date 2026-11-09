// Coach view of the count: votes per player and how many have voted. Never shows who voted whom.
import type { Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { playerName } from '@/shared/utils/format'
import type { MvpTally } from '../api'

interface TallyCardProps {
  tally: MvpTally | undefined
  /** Roster entries by id, to show names. */
  playersById: Map<string, Player>
}

export function TallyCard({ tally, playersById }: TallyCardProps) {
  return (
    <Card className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-semibold">Recuento</p>
        {tally && (
          <span className="text-sm text-slate-500">
            Han votado {tally.voters} de {tally.eligible}
          </span>
        )}
      </div>
      {!tally && <p className="text-sm text-slate-500">Cargando…</p>}
      {tally?.votes.length === 0 && <p className="text-sm text-slate-500">Aún no hay votos.</p>}
      {tally?.votes.map(({ playerId, votes }) => {
        const player = playersById.get(playerId)
        return (
          <div
            key={playerId}
            className="flex items-center justify-between border-t border-slate-100 pt-2 text-sm"
          >
            <span className="font-medium text-slate-800">
              {player ? playerName(player) : 'Jugadora borrada'}
            </span>
            <span className="font-semibold text-slate-700">
              {votes} {votes === 1 ? 'voto' : 'votos'}
            </span>
          </div>
        )
      })}
      <p className="text-xs text-slate-400">
        El voto es secreto: no se ve quién ha votado a quién.
      </p>
    </Card>
  )
}
