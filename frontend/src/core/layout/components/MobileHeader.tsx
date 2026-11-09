// Top bar on phones and tablets, filled with the open team's colour: the ☰ button and the team's
// name. Both open the menu, so changing team is one tap away.
import { useOpenTeam } from '../teamMenu'
import { ROLE_LABELS } from '@/shared/domain/labels'

export function MobileHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const openTeam = useOpenTeam()

  return (
    <header
      style={openTeam ? { backgroundColor: openTeam.color } : undefined}
      className="sticky top-0 z-10 flex items-center gap-3 bg-blue-900 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 text-white lg:hidden"
    >
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-2xl hover:bg-white/15"
      >
        ☰
      </button>
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Cambiar de equipo"
        className="min-w-0 flex-1 rounded-lg px-3 py-1 text-left hover:bg-white/15"
      >
        <p className="truncate text-lg leading-tight font-bold">{openTeam?.name ?? 'Voley APP'}</p>
        {openTeam && <p className="text-xs text-white/80">{ROLE_LABELS[openTeam.role]}</p>}
      </button>
    </header>
  )
}
