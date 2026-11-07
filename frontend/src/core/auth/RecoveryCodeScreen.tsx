// Shown once after signing up or resetting the password: the recovery code the user must keep.
import { useState } from 'react'
import { useAuth } from '@/core/auth/auth'
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '@/shared/ui/form'
import { RecoveryCodeBox } from './components/RecoveryCodeBox'

export function RecoveryCodeScreen({ code }: { code: string }) {
  const { dismissRecoveryNotice } = useAuth()
  const [saved, setSaved] = useState(false)

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 bg-slate-50 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Guarda tu código de recuperación</h1>
        <p className="mt-2 text-sm text-slate-600">
          Si algún día olvidas la contraseña, con tu usuario y este código podrás poner una nueva tú
          solo. Haz una captura de pantalla o apúntalo. Solo se muestra ahora.
        </p>
      </div>

      <RecoveryCodeBox code={code} />

      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={saved}
          onChange={(e) => setSaved(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-blue-800"
        />
        <span>Ya lo he guardado</span>
      </label>

      <button
        type="button"
        disabled={!saved}
        onClick={dismissRecoveryNotice}
        className={saved ? PRIMARY_BUTTON_CLASS : SECONDARY_BUTTON_CLASS}
      >
        Continuar
      </button>
    </div>
  )
}
