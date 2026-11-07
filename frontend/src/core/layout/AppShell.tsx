// Shell around every screen once signed in. PC (lg): sidebar with the teams menu always visible.
// Phones: header with a ☰ button that opens the same menu, plus bottom tabs while a team is open.
import { useState } from 'react'
import { Outlet } from 'react-router'
import { BottomNav } from './components/BottomNav'
import { MobileDrawer } from './components/MobileDrawer'
import { MobileHeader } from './components/MobileHeader'
import { SideNav } from './components/SideNav'

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-slate-50 lg:flex">
      <SideNav />
      {menuOpen && <MobileDrawer onClose={() => setMenuOpen(false)} />}

      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col lg:max-w-6xl">
        <MobileHeader onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 px-4 pt-4 pb-24 lg:px-10 lg:pt-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
