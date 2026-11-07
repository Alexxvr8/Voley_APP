// Bottom tab bar on phones and tablets, one tab per visible module. Hidden on wide screens.
import { NavLink } from 'react-router'
import type { ModuleMenuEntry } from '@/core/modules/types'

export function BottomNav({ menu }: { menu: ModuleMenuEntry[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="flex">
        {menu.map((entry) => (
          <li key={entry.path} className="flex-1">
            <NavLink
              to={entry.path}
              className={({ isActive }) =>
                `block py-3.5 text-center text-sm font-semibold ${isActive ? 'text-blue-800' : 'text-slate-500'}`
              }
            >
              {entry.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
