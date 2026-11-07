// Account creation: username, visible name, password twice and the data consent checkbox.
import { useState, type FormEvent } from 'react'
import { normalizeUsername, useAuth, USERNAME_PATTERN } from '@/core/auth/auth'
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

export function SignUpForm() {
  const { signUp } = useAuth()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!USERNAME_PATTERN.test(normalizeUsername(username))) {
      setError(
        'El usuario debe tener entre 3 y 30 letras, números, puntos o guiones, sin espacios ni tildes.',
      )
      return
    }
    const problem = newPasswordProblem(password, confirmation)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    try {
      await signUp(username, displayName || username, password)
    } catch (err) {
      setError(authErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <UsernameField value={username} onChange={setUsername} />
      <label className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Tu nombre</span>
        <input
          className={INPUT_CLASS}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name"
          placeholder="Como te verá el equipo"
          maxLength={60}
        />
      </label>
      <PasswordFields
        password={password}
        confirmation={confirmation}
        onPasswordChange={setPassword}
        onConfirmationChange={setConfirmation}
      />
      <label className="flex items-start gap-3 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-blue-800"
          required
        />
        <span>
          Acepto que la app guarde mi nombre y mis datos de juego. Si tengo menos de 14 años, mis
          padres o tutores lo han autorizado.
        </span>
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
        {busy ? 'Un momento…' : 'Crear cuenta'}
      </button>
    </form>
  )
}
