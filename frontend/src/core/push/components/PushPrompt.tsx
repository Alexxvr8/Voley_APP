// Strip at the top inviting to turn notifications on, until they are on or the user closes it.
import { useState } from 'react'
import { usePush } from '../usePush'

const DISMISSED_KEY = 'push-prompt-dismissed'

function wasDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function PushPrompt() {
  const { state, busy, enable } = usePush()
  const [dismissed, setDismissed] = useState(wasDismissed)
  if (state !== 'off' || dismissed) return null

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // Private mode: it will show again next time, which is fine.
    }
  }

  return (
    <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 text-sm text-blue-900">
      <p className="min-w-0 flex-1">
        🔔 Activa los avisos para enterarte de convocatorias y partidos.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={enable}
        className="shrink-0 rounded-lg bg-blue-800 px-3 py-1.5 font-semibold text-white"
      >
        Activar
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Ahora no"
        className="shrink-0 px-1 text-blue-700"
      >
        ✕
      </button>
    </div>
  )
}
