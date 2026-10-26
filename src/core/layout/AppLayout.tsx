import { NavLink, Outlet } from 'react-router'
import { modules } from '@/core/modules/registry'
import type { TeamRole } from '@/core/modules/types'
import { hasRole, useSession } from '@/core/session/session'
import { team } from '@/shared/mock/data'

const ROLE_OPTIONS: { role: TeamRole; label: string }[] = [
  { role: 'coach', label: 'Entrenador' },
  { role: 'player', label: 'Jugador' },
]

export function AppLayout() {
  const { role, setRole } = useSession()
  const menu = modules.filter(
    (module) => module.menu && team.enabledModules.includes(module.id) && hasRole(role, module.minRole),
  )

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-slate-50">
      <header className="sticky top-0 z-10 bg-blue-900 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold leading-tight">Voley APP</p>
            <p className="text-xs text-blue-200">
              {team.name} · {team.season}
            </p>
          </div>
          <div className="flex rounded-full bg-blue-950/60 p-0.5 text-xs" role="group" aria-label="Ver como">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option.role}
                type="button"
                onClick={() => setRole(option.role)}
                className={`rounded-full px-3 py-1 font-semibold ${
                  role === option.role ? 'bg-white text-blue-900' : 'text-blue-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <p className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">
        Prototipo con datos de ejemplo: los cambios no se guardan.
      </p>

      <main className="flex-1 px-4 pt-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <ul className="flex">
          {menu.map((module) => (
            <li key={module.id} className="flex-1">
              <NavLink
                to={module.menu!.path}
                className={({ isActive }) =>
                  `block py-3.5 text-center text-sm font-semibold ${isActive ? 'text-blue-800' : 'text-slate-500'}`
                }
              >
                {module.menu!.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
