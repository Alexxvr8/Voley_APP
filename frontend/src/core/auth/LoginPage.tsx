import { useState, type FormEvent } from 'react'
import { isAuthError } from '@supabase/supabase-js'
import { normalizeUsername, useAuth, USERNAME_PATTERN } from '@/core/auth/auth'

type Mode = 'signIn' | 'signUp'

const MIN_PASSWORD_LENGTH = 6

/** Maps Supabase Auth errors to messages a young player can understand. */
function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message === 'email_confirmation_enabled') {
    return 'La cuenta se ha creado, pero el servidor pide confirmar el email. Avisa al entrenador.'
  }
  if (isAuthError(error)) {
    switch (error.code) {
      case 'invalid_credentials':
        return 'Usuario o contraseña incorrectos.'
      case 'user_already_exists':
        return 'Ese usuario ya existe. Prueba con otro.'
      case 'weak_password':
        return `La contraseña es muy débil. Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`
      case 'over_request_rate_limit':
        return 'Demasiados intentos. Espera un momento y vuelve a probar.'
    }
  }
  if (!navigator.onLine) return 'No hay conexión. Conéctate a internet para entrar.'
  return 'Algo ha fallado. Inténtalo de nuevo.'
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-200'

export function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signIn')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (mode === 'signUp') {
      if (!USERNAME_PATTERN.test(normalizeUsername(username))) {
        setError('El usuario debe tener entre 3 y 30 letras, números, puntos o guiones, sin espacios ni tildes.')
        return
      }
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
        return
      }
    }
    setBusy(true)
    try {
      if (mode === 'signIn') await signIn(username, password)
      else await signUp(username, displayName || username, password)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-slate-50 px-6 py-10">
      <div className="mb-8 text-center">
        <p className="text-3xl font-bold text-blue-900">Voley APP</p>
        <p className="mt-1 text-sm text-slate-500">Partidos, convocatorias y rotaciones de tu equipo</p>
      </div>

      <div className="mb-6 flex rounded-full bg-slate-200 p-1 text-sm font-semibold" role="tablist">
        {(
          [
            ['signIn', 'Entrar'],
            ['signUp', 'Crear cuenta'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => switchMode(value)}
            className={`flex-1 rounded-full py-2.5 ${mode === value ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-700">Usuario</span>
          <input
            className={inputClass}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </label>

        {mode === 'signUp' && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">Tu nombre</span>
            <input
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              placeholder="Como te verá el equipo"
              maxLength={60}
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-700">Contraseña</span>
          <input
            className={inputClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            required
          />
        </label>

        {mode === 'signUp' && (
          <label className="flex items-start gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-blue-800"
              required
            />
            <span>
              Acepto que la app guarde mi nombre y mis datos de juego. Si tengo menos de 14 años, mis padres o tutores
              lo han autorizado.
            </span>
          </label>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-xl bg-blue-800 py-3.5 text-base font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Un momento…' : mode === 'signIn' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      {mode === 'signIn' && (
        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Has olvidado la contraseña? Pídele al entrenador que te la cambie.
        </p>
      )}
    </div>
  )
}
