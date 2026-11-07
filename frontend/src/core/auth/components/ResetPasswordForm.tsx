// Self-service password reset: username, recovery code and the new password twice.
import { useState, type FormEvent } from 'react'
import { useAuth } from '@/core/auth/auth'
import { authErrorMessage, newPasswordProblem } from '@/core/auth/errors'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '@/shared/ui/form'
import { PasswordFields } from './PasswordFields'
import { UsernameField } from './UsernameField'

export function ResetPasswordForm({ onBack }: { onBack: () => void }) {
  const { resetPassword } = useAuth()
  const [username, setUsername] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const problem = newPasswordProblem(password, confirmation)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    try {
      await resetPassword(username, code, password)
    } catch (err) {
      setError(authErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">
        Usa el código de recuperación que guardaste al crear la cuenta. Si no lo tienes, elige "Por
        correo".
      </p>
      <UsernameField value={username} onChange={setUsername} />
      <label className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Código de recuperación</span>
        <input
          className={`${INPUT_CLASS} font-mono uppercase tracking-wider`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="XXXX-XXXX-XXXX"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          required
        />
      </label>
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
        className={`mt-2 py-3.5 text-base ${PRIMARY_BUTTON_CLASS}`}
      >
        {busy ? 'Un momento…' : 'Cambiar contraseña y entrar'}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-blue-800 underline"
      >
        Volver a entrar
      </button>
    </form>
  )
}
