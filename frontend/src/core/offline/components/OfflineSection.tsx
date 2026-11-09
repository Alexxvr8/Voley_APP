// Shown instead of a section that needs internet while the device is offline: what can be used
// without network, with direct links (the downloaded matches' rotations are otherwise reached
// through Partidos, which needs network).
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { queryClient } from '@/core/query/queryClient'
import { hasRole, useCurrentTeam, useTeamPath } from '@/core/teams/currentTeam'
import type { Match } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { formatShortDate } from '@/shared/utils/format'
import { offlineDb } from '../db'

export function OfflineSection() {
  const { team, role } = useCurrentTeam()
  const teamPath = useTeamPath()
  const downloaded = useLiveQuery(
    () => offlineDb.offlineMatches.where('teamId').equals(team.id).toArray(),
    [team.id],
  )
  // Same cache the matches and lineup modules fill (saved on the device).
  const matches = queryClient.getQueryData<Match[]>(['matches', team.id]) ?? []
  const canUseRotations = hasRole(role, 'assistant') && team.enabledModules.includes('lineup')
  const ready = matches
    .filter((match) => downloaded?.some((entry) => entry.matchId === match.id))
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <section className="space-y-4 lg:max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Sin conexión</h1>
        <p className="text-sm text-slate-500">
          Esta sección necesita internet. Mientras tanto puedes usar lo que está guardado en el
          móvil.
        </p>
      </div>

      {team.enabledModules.includes('roster') && (
        <Link
          to={teamPath('plantilla')}
          className="block rounded-2xl bg-white p-4 font-semibold text-blue-900 shadow-sm ring-1 ring-slate-200"
        >
          Ver la plantilla →
        </Link>
      )}

      {canUseRotations && (
        <Card className="space-y-2">
          <p className="font-semibold">Partidos descargados</p>
          {ready.length === 0 && (
            <p className="text-sm text-slate-500">
              Ninguno. Con internet, abre la app y se descargan solos los próximos partidos.
            </p>
          )}
          {ready.map((match) => (
            <div
              key={match.id}
              className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-slate-900">
                  vs {match.opponent}
                </span>
                <span className="block text-xs text-slate-500 first-letter:uppercase">
                  {formatShortDate(match.date)}
                  {match.matchTime && ` · ${match.matchTime}`}
                </span>
              </span>
              <Link
                to={teamPath(`partidos/${match.id}/rotacion`)}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Rotación
              </Link>
              <Link
                to={teamPath(`partidos/${match.id}/partido`)}
                className="rounded-lg bg-blue-800 px-3 py-2 text-sm font-semibold text-white"
              >
                Ir al partido
              </Link>
            </div>
          ))}
        </Card>
      )}
    </section>
  )
}
