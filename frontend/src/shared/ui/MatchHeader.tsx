// Top of every match screen: back link, date, opponent and the Info / Gestión / Rotación tabs.
import { Link, NavLink } from 'react-router'
import type { Match } from '@/shared/domain/types'
import { formatLongDate } from '@/shared/utils/format'

interface MatchHeaderProps {
  match: Match
  /** Link of the back arrow (the calendar). */
  backHref: string
  /** Base path of the match, e.g. `/equipos/<team>/partidos/<match>`. */
  matchPath: string
  /** Staff get the Gestión tab. */
  showManagement: boolean
  /** Staff get the Rotación tab when the team has the lineup section on. */
  showRotation: boolean
}

export function MatchHeader({
  match,
  backHref,
  matchPath,
  showManagement,
  showRotation,
}: MatchHeaderProps) {
  const tabs = [
    { label: 'Info', to: matchPath },
    ...(showManagement ? [{ label: 'Gestión', to: `${matchPath}/gestion` }] : []),
    ...(showRotation ? [{ label: 'Rotación', to: `${matchPath}/rotacion` }] : []),
  ]

  return (
    <div className="space-y-3">
      <Link to={backHref} className="text-sm font-medium text-blue-800">
        ← Calendario
      </Link>
      <div>
        <p className="text-sm font-medium text-blue-800 first-letter:uppercase">
          {formatLongDate(match.date)}
          {match.matchTime && ` · ${match.matchTime}`}
        </p>
        <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">vs {match.opponent}</h1>
      </div>
      {tabs.length > 1 && (
        <nav className="flex rounded-xl bg-slate-200 p-1 text-sm font-semibold lg:max-w-md">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) =>
                `flex-1 rounded-lg py-2 text-center ${isActive ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
