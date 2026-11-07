// Left sidebar on wide screens (PC): always shows the teams menu.
import { TeamsMenu } from './TeamsMenu'

export function SideNav() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 bg-blue-900 p-5 text-white lg:flex">
      <p className="text-lg font-bold">Voley APP</p>
      <TeamsMenu />
    </aside>
  )
}
