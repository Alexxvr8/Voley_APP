// Sign-in form: username and password.
import { useState, type FormEvent } from 'react'
import { useAuth } from '@/core/auth/auth'
import { authErrorMessage } from '@/core/auth/errors'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '@/shared/ui/form'
import { UsernameField } from './UsernameField'

export function SignInForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await signIn(username, password)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <UsernameField value={username} onChange={setUsername} />
      <label className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Contraseña</span>
        <input
          className={INPUT_CLASS}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

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
        {busy ? 'Un momento…' : 'Entrar'}
      </button>
      <button
        type="button"
        onClick={onForgotPassword}
        className="text-sm font-medium text-blue-800 underline"
      >
        He olvidado la contraseña
      </button>
    </form>
  )
}
