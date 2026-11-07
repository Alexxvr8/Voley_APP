// Top bar on phones and tablets: the ☰ button that opens the menu and the name of the open team.
import { useOpenTeam } from '../teamMenu'
import { ROLE_LABELS } from '@/shared/domain/labels'

export function MobileHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const openTeam = useOpenTeam()

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 bg-blue-900 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 text-white lg:hidden">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-2xl hover:bg-blue-800"
      >
        ☰
      </button>
      <div className="min-w-0">
        <p className="truncate text-lg leading-tight font-bold">{openTeam?.name ?? 'Voley APP'}</p>
        {openTeam && <p className="text-xs text-blue-200">{ROLE_LABELS[openTeam.role]}</p>}
      </div>
    </header>
  )
}
