// Players who left in a past season ("bajas"). Their history stays; "Vuelve" puts them back on the
// roster. If they had an account, they join again with the code and are accepted with this entry.
import type { Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { byShirtNumber, playerName } from '@/shared/utils/format'
import { useSetPlayerActive } from '../api'

export function FormerPlayersCard({ teamId, former }: { teamId: string; former: Player[] }) {
  const setActive = useSetPlayerActive(teamId)
  if (former.length === 0) return null

  return (
    <Card className="space-y-2">
      <div>
        <p className="font-semibold">Bajas de temporadas anteriores</p>
        <p className="text-sm text-slate-500">
          No salen en la plantilla, pero conservan su historial.
        </p>
      </div>
      {[...former].sort(byShirtNumber).map((player) => (
        <div
          key={player.id}
          className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2"
        >
          <span className="truncate text-sm font-medium text-slate-800">{playerName(player)}</span>
          <button
            type="button"
            disabled={setActive.isPending}
            onClick={() => setActive.mutate({ playerId: player.id, active: true })}
            className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
          >
            Vuelve
          </button>
        </div>
      ))}
    </Card>
  )
}
