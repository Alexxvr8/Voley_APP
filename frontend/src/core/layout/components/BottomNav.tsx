// Bottom tabs on phones while a team is open: one per section of the team. Hidden on wide screens.
import { NavLink } from 'react-router'
import { useOpenTeam, useTeamMenu } from '../teamMenu'

export function BottomNav() {
  const openTeam = useOpenTeam()
  const sections = useTeamMenu(openTeam)
  if (!openTeam || sections.length === 0) return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="mx-auto flex max-w-md">
        {sections.map((section) => (
          <li key={section.path} className="flex-1">
            <NavLink
              to={`/equipos/${openTeam.id}/${section.path}`}
              className={({ isActive }) =>
                `block py-3.5 text-center text-sm font-semibold ${isActive ? 'text-blue-800' : 'text-slate-500'}`
              }
            >
              {section.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
