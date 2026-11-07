// Modal that asks "are you sure?" before an important change: the second check of a two-step action.
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  /** Disables the buttons while the change is being saved. */
  busy?: boolean
}

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-xl">
        <p className="text-lg font-bold text-slate-900">{title}</p>
        <div className="text-sm text-slate-600">{children}</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-xl bg-blue-800 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-60"
          >
            {busy ? 'Guardando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
