// Opened from the reset email link (`/?recuperar=<token>&usuario=<name>`): choose a new password.
import { useState, type FormEvent } from 'react'
import { useAuth } from '@/core/auth/auth'
import { authErrorMessage, newPasswordProblem } from '@/core/auth/errors'
import { ERROR_CLASS, PRIMARY_BUTTON_CLASS } from '@/shared/ui/form'
import { PasswordFields } from './components/PasswordFields'

interface EmailResetScreenProps {
  username: string
  token: string
  /** Called after the new password is set (and when giving up), to leave this screen. */
  onDone: () => void
}

export function EmailResetScreen({ username, token, onDone }: EmailResetScreenProps) {
  const { resetPasswordWithEmail } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const problem = newPasswordProblem(password, confirmation)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    try {
      await resetPasswordWithEmail(username, token, password)
      onDone()
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'recovery_rejected'
          ? 'El enlace ya se ha usado o ha caducado. Pide otro desde "He olvidado la contraseña".'
          : authErrorMessage(err),
      )
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-slate-50 px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Contraseña nueva</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600">
        Para el usuario <strong>{username}</strong>.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordFields
          label="Contraseña nueva"
          password={password}
          confirmation={confirmation}
          onPasswordChange={setPassword}
          onConfirmationChange={setConfirmation}
        />
        {error && (
          <p role="alert" className={ERROR_CLASS}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className={`py-3.5 text-base ${PRIMARY_BUTTON_CLASS}`}
        >
          {busy ? 'Un momento…' : 'Guardar y entrar'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-sm font-medium text-blue-800 underline"
        >
          Cancelar
        </button>
      </form>
    </div>
  )
}
