// One team in "Mis equipos": name, category, the user's role and whether they are still pending.
import { Link } from 'react-router'
import { ROLE_LABELS } from '@/shared/domain/labels'
import type { MyTeam } from '@/shared/domain/types'

export function TeamCard({ team }: { team: MyTeam }) {
  const details = [team.category, team.season].filter(Boolean).join(' · ')

  return (
    <Link
      to={`/equipos/${team.id}`}
      className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-blue-300"
    >
      <div className="min-w-0">
        <p className="truncate text-lg font-bold text-slate-900">{team.name}</p>
        {details && <p className="text-sm text-slate-500">{details}</p>}
      </div>
      {team.pending ? (
        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          Pendiente
        </span>
      ) : (
        <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">
          {ROLE_LABELS[team.role]}
        </span>
      )}
    </Link>
  )
}
