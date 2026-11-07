// Lets the user replace a lost recovery code; the new one is shown once.
import { useState } from 'react'
import { createRecoveryCode } from '@/core/auth/accounts'
import { RecoveryCodeBox } from '@/core/auth/components/RecoveryCodeBox'
import { Card } from '@/shared/ui/Card'
import { ERROR_CLASS, SECONDARY_BUTTON_CLASS } from '@/shared/ui/form'

export function RecoveryCodeCard() {
  const [code, setCode] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  async function regenerate() {
    setFailed(false)
    try {
      setCode(await createRecoveryCode())
    } catch {
      setFailed(true)
    }
  }

  return (
    <Card className="space-y-3">
      <p className="font-semibold">Código de recuperación</p>
      <p className="text-sm text-slate-600">
        Si has perdido tu código, crea uno nuevo. El anterior dejará de servir.
      </p>
      {code && <RecoveryCodeBox code={code} />}
      {failed && <p className={ERROR_CLASS}>No se ha podido crear el código. ¿Hay conexión?</p>}
      <button type="button" onClick={regenerate} className={SECONDARY_BUTTON_CLASS}>
        Crear código nuevo
      </button>
    </Card>
  )
}
