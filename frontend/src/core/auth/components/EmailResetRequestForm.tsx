// "Por correo": asks for the username and sends a reset link to the account's recovery email.
import { useState, type FormEvent } from 'react'
import { requestResetEmail } from '@/core/auth/accounts'
import { ERROR_CLASS, PRIMARY_BUTTON_CLASS } from '@/shared/ui/form'
import { UsernameField } from './UsernameField'

type Status = 'idle' | 'sending' | 'sent' | 'not_configured' | 'failed'

export function EmailResetRequestForm() {
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    try {
      setStatus(await requestResetEmail(username))
    } catch {
      setStatus('failed')
    }
  }

  if (status === 'sent') {
    return (
      <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Si tu usuario tiene un correo guardado, te hemos enviado un enlace. Ábrelo antes de 1 hora y
        mira también en la carpeta de spam.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">
        Te enviamos un enlace al correo que guardaste en tu cuenta para que pongas una contraseña
        nueva.
      </p>
      <UsernameField value={username} onChange={setUsername} />
      {status === 'not_configured' && (
        <p className={ERROR_CLASS}>
          La recuperación por correo aún no está activada. Usa tu código de recuperación o pide al
          entrenador una contraseña temporal.
        </p>
      )}
      {status === 'failed' && <p className={ERROR_CLASS}>No se ha podido enviar. ¿Hay conexión?</p>}
      <button
        type="submit"
        disabled={status === 'sending'}
        className={`py-3.5 text-base ${PRIMARY_BUTTON_CLASS}`}
      >
        {status === 'sending' ? 'Enviando…' : 'Enviarme el enlace'}
      </button>
    </form>
  )
}
