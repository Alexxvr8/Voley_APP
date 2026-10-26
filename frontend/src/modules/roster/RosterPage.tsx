// Team roster sorted by shirt number, with main and secondary positions.
import { SYSTEM_LABELS } from '@/shared/domain/labels'
import { players, team } from '@/shared/mock/data'
import { Card } from '@/shared/ui/Card'
import { PositionBadge } from '@/shared/ui/PositionBadge'
import { playerName } from '@/shared/utils/format'

export function RosterPage() {
  const sorted = [...players].sort((a, b) => a.number - b.number)

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-slate-900">Plantilla</h1>
        <span className="text-sm text-slate-500">{players.length} jugadoras/es</span>
      </div>
      <p className="text-sm text-slate-600">
        Sistema por defecto: <span className="font-semibold">{SYSTEM_LABELS[team.defaultSystem]}</span>
      </p>

      <Card className="divide-y divide-slate-100 p-0">
        {sorted.map((player) => (
          <div key={player.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-900 font-bold text-white">
              {player.number}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">{playerName(player)}</p>
              <p className="text-xs text-slate-500">{player.birthYear}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              <PositionBadge position={player.mainPosition} />
              {player.otherPositions.map((position) => (
                <span key={position} className="opacity-60">
                  <PositionBadge position={position} short />
                </span>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </section>
  )
}
