// The app menu: the user's teams (each card filled with its colour, the others dimmed) and a "+" to
// add one. On PC the open team unfolds its sections below its name; on phones those are already in
// the bottom tabs.
import { Link, NavLink } from 'react-router'
import { useMyTeams } from '@/core/teams/api'
import { ROLE_LABELS } from '@/shared/domain/labels'
import { useOpenTeam, useTeamMenu } from '../teamMenu'

interface TeamsMenuProps {
  /** Closes the phone drawer after a tap. */
  onNavigate?: () => void
  /** Lists the open team's sections under it (off on phones, where the bottom tabs show them). */
  showSections?: boolean
}

export function TeamsMenu({ onNavigate, showSections = true }: TeamsMenuProps) {
  const myTeams = useMyTeams()
  const openTeam = useOpenTeam()
  const sections = useTeamMenu(openTeam)

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Link
            to="/"
            onClick={onNavigate}
            className="text-xs font-semibold tracking-wide text-blue-300 uppercase hover:text-white"
          >
            Mis equipos
          </Link>
          <Link
            to="/equipos/nuevo"
            onClick={onNavigate}
            aria-label="Añadir equipo"
            title="Añadir equipo"
            className="flex size-8 items-center justify-center rounded-full bg-white text-lg font-bold text-blue-900 hover:bg-blue-100"
          >
            +
          </Link>
        </div>

        {myTeams.data?.length === 0 && (
          <p className="text-sm text-blue-200">
            Pulsa + para crear un equipo o entrar con un código.
          </p>
        )}
        <ul className="space-y-2">
          {myTeams.data?.map((team) => {
            const isOpen = team.id === openTeam?.id
            return (
              <li key={team.id}>
                <Link
                  to={`/equipos/${team.id}`}
                  onClick={onNavigate}
                  style={{ backgroundColor: team.color }}
                  aria-current={isOpen ? 'true' : undefined}
                  className={`block rounded-lg px-3 py-2 text-white hover:brightness-110 ${isOpen ? '' : 'opacity-70 hover:opacity-100'}`}
                >
                  <span className="block truncate font-semibold">{team.name}</span>
                  <span className="block text-xs text-white/80">
                    {team.pending ? 'Pendiente de aceptar' : ROLE_LABELS[team.role]}
                  </span>
                </Link>
                {isOpen && showSections && (
                  <ul className="mt-1 ml-4 space-y-1 border-l border-blue-700 pl-3">
                    {sections.map((section) => (
                      <li key={section.path}>
                        <NavLink
                          to={`/equipos/${team.id}/${section.path}`}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            `block rounded-lg px-3 py-1.5 text-sm font-semibold ${
                              isActive
                                ? 'bg-white text-blue-900'
                                : 'text-blue-100 hover:bg-blue-800'
                            }`
                          }
                        >
                          {section.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <Link
        to="/cuenta"
        onClick={onNavigate}
        className="mt-auto text-sm text-blue-200 underline hover:text-white"
      >
        Mi cuenta
      </Link>
    </nav>
  )
}
