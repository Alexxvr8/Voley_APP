// Change the password of the signed-in account (asks for it twice).
import { useState, type FormEvent } from 'react'
import { PasswordFields } from '@/core/auth/components/PasswordFields'
import { newPasswordProblem } from '@/core/auth/errors'
import { supabase } from '@/core/supabase/client'
import { Card } from '@/shared/ui/Card'
import { ERROR_CLASS, PRIMARY_BUTTON_CLASS } from '@/shared/ui/form'

export function ChangePasswordCard() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const problem = newPasswordProblem(password, confirmation)
    if (problem) {
      setMessage({ ok: false, text: problem })
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      setMessage({ ok: false, text: 'No se ha podido cambiar. Prueba con otra contraseña.' })
      return
    }
    setPassword('')
    setConfirmation('')
    setMessage({ ok: true, text: 'Contraseña cambiada.' })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="font-semibold">Cambiar contraseña</p>
        <PasswordFields
          label="Contraseña nueva"
          password={password}
          confirmation={confirmation}
          onPasswordChange={setPassword}
          onConfirmationChange={setConfirmation}
        />
        {message && (
          <p className={message.ok ? 'text-sm text-emerald-700' : ERROR_CLASS}>{message.text}</p>
        )}
        <button type="submit" disabled={busy} className={PRIMARY_BUTTON_CLASS}>
          {busy ? 'Guardando…' : 'Cambiar contraseña'}
        </button>
      </form>
    </Card>
  )
}
