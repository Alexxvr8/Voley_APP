// "Disponible sin conexión · 18:05" for a match, with "Preparar para sin conexión" to download it now.
import { useState } from 'react'
import { useMyTeams } from '@/core/teams/api'
import { prepareTeamOffline, useOfflineMatch } from '../prepare'
import { useOnline } from '../online'

const timeFormatter = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const dayFormatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })

function syncedLabel(syncedAt: number): string {
  const date = new Date(syncedAt)
  const sameDay = date.toDateString() === new Date().toDateString()
  return sameDay
    ? timeFormatter.format(date)
    : `${dayFormatter.format(date)}, ${timeFormatter.format(date)}`
}

export function OfflineStatus({ teamId, matchId }: { teamId: string; matchId: string }) {
  const offline = useOfflineMatch(matchId)
  const online = useOnline()
  const myTeams = useMyTeams()
  const [state, setState] = useState<'idle' | 'busy' | 'failed'>('idle')

  async function prepare() {
    const team = myTeams.data?.find((t) => t.id === teamId)
    if (!team) return
    setState('busy')
    try {
      await prepareTeamOffline(team)
      setState('idle')
    } catch {
      setState('failed')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      {offline ? (
        <span className="font-semibold text-emerald-700">
          ✓ Disponible sin conexión · {syncedLabel(offline.syncedAt)}
        </span>
      ) : (
        <span className="font-semibold text-slate-500">
          Aún no descargado para usar sin conexión
        </span>
      )}
      {online && (
        <button
          type="button"
          onClick={prepare}
          disabled={state === 'busy'}
          className="font-medium text-blue-800 underline"
        >
          {state === 'busy' ? 'Descargando…' : 'Preparar para sin conexión'}
        </button>
      )}
      {state === 'failed' && <span className="text-rose-700">No se ha podido descargar.</span>}
    </div>
  )
}
