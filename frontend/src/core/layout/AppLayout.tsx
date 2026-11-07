// Shell around every screen once signed in. Phones: top header and bottom tabs.
// Wide screens (lg, PC): left sidebar and a wider content area.
import { Outlet } from 'react-router'
import { modules } from '@/core/modules/registry'
import type { ModuleMenuEntry } from '@/core/modules/types'
import { hasRole, useSession } from '@/core/session/session'
import { team } from '@/shared/mock/data'
import { BottomNav } from './components/BottomNav'
import { MobileHeader } from './components/MobileHeader'
import { SideNav } from './components/SideNav'

export function AppLayout() {
  const { role } = useSession()
  const menu: ModuleMenuEntry[] = modules
    .filter((module) => team.enabledModules.includes(module.id) && hasRole(role, module.minRole))
    .flatMap((module) => (module.menu ? [module.menu] : []))

  return (
    <div className="min-h-dvh bg-slate-50 lg:flex">
      <SideNav menu={menu} />

      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col lg:max-w-6xl">
        <MobileHeader />

        <p className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">
          Prototipo con datos de ejemplo: los cambios no se guardan.
        </p>

        <main className="flex-1 px-4 pt-4 pb-24 lg:px-10 lg:pt-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <BottomNav menu={menu} />
    </div>
  )
}
