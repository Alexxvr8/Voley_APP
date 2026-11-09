// Result of a finished vote: the MVP (or co-MVPs), or "Sin MVP" when nobody voted.
import type { Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { playerName } from '@/shared/utils/format'

export function WinnerCard({ winners }: { winners: Player[] }) {
  if (winners.length === 0) {
    return (
      <Card>
        <p className="font-semibold">Sin MVP</p>
        <p className="text-sm text-slate-500">Nadie votó en este partido.</p>
      </Card>
    )
  }
  return (
    <Card className="space-y-2 bg-amber-50 ring-amber-200">
      <p className="text-sm font-semibold text-amber-800">
        {winners.length > 1 ? 'Co-MVP del partido' : 'MVP del partido'}
      </p>
      {winners.map((player) => (
        <p key={player.id} className="text-2xl font-bold text-slate-900">
          ★ {playerName(player)}
        </p>
      ))}
    </Card>
  )
}
