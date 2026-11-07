// Left sidebar on wide screens (PC): app name, team, menu, role switch and account.
import { NavLink } from 'react-router'
import type { ModuleMenuEntry } from '@/core/modules/types'
import { team } from '@/shared/mock/data'
import { AccountButton } from './AccountButton'
import { RoleSwitch } from './RoleSwitch'

export function SideNav({ menu }: { menu: ModuleMenuEntry[] }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-blue-900 p-5 text-white lg:flex">
      <p className="text-xl font-bold">Voley APP</p>
      <p className="text-sm text-blue-200">
        {team.name} · {team.season}
      </p>

      <nav className="mt-8 flex-1">
        <ul className="space-y-1">
          {menu.map((entry) => (
            <li key={entry.path}>
              <NavLink
                to={entry.path}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 font-semibold ${
                    isActive ? 'bg-white text-blue-900' : 'text-blue-100 hover:bg-blue-800'
                  }`
                }
              >
                {entry.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-3">
        <RoleSwitch />
        <AccountButton />
      </div>
    </aside>
  )
}
