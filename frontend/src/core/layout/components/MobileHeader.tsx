// Top bar on phones and tablets: app name, team, account and role switch. Hidden on wide screens.
import { team } from '@/shared/mock/data'
import { AccountButton } from './AccountButton'
import { RoleSwitch } from './RoleSwitch'

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-10 bg-blue-900 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 text-white lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-lg leading-tight font-bold">Voley APP</p>
          <p className="text-xs text-blue-200">
            {team.name} · {team.season}
          </p>
          <AccountButton />
        </div>
        <RoleSwitch />
      </div>
    </header>
  )
}
