// Phone menu: slides in from the left over the screen with the same content as the PC sidebar.
import { TeamsMenu } from './TeamsMenu'

export function MobileDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/50"
      />
      <div className="relative flex h-full w-72 max-w-[85%] flex-col gap-6 bg-blue-900 p-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-white shadow-xl">
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold">Voley APP</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex size-9 items-center justify-center rounded-lg text-xl hover:bg-blue-800"
          >
            ✕
          </button>
        </div>
        <TeamsMenu onNavigate={onClose} />
      </div>
    </div>
  )
}
