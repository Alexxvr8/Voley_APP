// Season MVP ranking. The coach sees every competing player and can hide it from the players.
import { Card } from '@/shared/ui/Card'
import { playerName } from '@/shared/utils/format'
import { useSetRankingVisible } from '../api'
import type { RankingEntry } from '../mvp'

interface RankingCardProps {
  teamId: string
  ranking: RankingEntry[]
  /** Whether players see the ranking. */
  visible: boolean
  /** Coach: shows the switch to hide or show it. */
  editable: boolean
}

export function RankingCard({ teamId, ranking, visible, editable }: RankingCardProps) {
  const setVisible = useSetRankingVisible(teamId)

  return (
    <Card className="space-y-2">
      <p className="font-semibold">Ranking de la temporada</p>
      {editable && (
        <label className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
          <span className="text-sm text-slate-700">Visible para las jugadoras</span>
          <input
            type="checkbox"
            role="switch"
            checked={visible}
            disabled={setVisible.isPending}
            onChange={() => setVisible.mutate(!visible)}
            className="size-5 accent-blue-800"
          />
        </label>
      )}
      {ranking.length === 0 && <p className="text-sm text-slate-500">Aún no hay ninguna MVP.</p>}
      {ranking.map(({ player, wins }, index) => (
        <div
          key={player.id}
          className="flex items-center gap-3 border-t border-slate-100 pt-2 text-sm"
        >
          <span className="w-6 text-right font-semibold text-slate-400">
            {wins > 0 ? index + 1 : ''}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
            {playerName(player)}
          </span>
          <span className={`font-semibold ${wins > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
            {wins > 0 ? `★ ${wins}` : '0'}
          </span>
        </div>
      ))}
    </Card>
  )
}
