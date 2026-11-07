// Screen shown without a session: sign in, create an account or reset a forgotten password
// (with the recovery code or with a link by email).
import { useState } from 'react'
import { EmailResetRequestForm } from './components/EmailResetRequestForm'
import { ResetPasswordForm } from './components/ResetPasswordForm'
import { SignInForm } from './components/SignInForm'
import { SignUpForm } from './components/SignUpForm'

type Mode = 'signIn' | 'signUp' | 'reset'

/** How a forgotten password is reset: with the recovery code or with a link by email. */
type ResetMethod = 'code' | 'email'

const TABS: [Mode, string][] = [
  ['signIn', 'Entrar'],
  ['signUp', 'Crear cuenta'],
]

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('signIn')
  const [resetMethod, setResetMethod] = useState<ResetMethod>('code')

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-slate-50 px-6 py-10">
      <div className="mb-8 text-center">
        <p className="text-3xl font-bold text-blue-900">Voley APP</p>
        <p className="mt-1 text-sm text-slate-500">
          Partidos, convocatorias y rotaciones de tu equipo
        </p>
      </div>

      {mode === 'reset' ? (
        <>
          <h1 className="mb-4 text-xl font-bold text-slate-900">Recuperar contraseña</h1>
          <div
            className="mb-4 flex rounded-full bg-slate-200 p-1 text-sm font-semibold"
            role="tablist"
          >
            {(
              [
                ['code', 'Con mi código'],
                ['email', 'Por correo'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={resetMethod === value}
                onClick={() => setResetMethod(value)}
                className={`flex-1 rounded-full py-2 ${resetMethod === value ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {resetMethod === 'code' ? (
            <ResetPasswordForm onBack={() => setMode('signIn')} />
          ) : (
            <>
              <EmailResetRequestForm />
              <button
                type="button"
                onClick={() => setMode('signIn')}
                className="mt-4 text-sm font-medium text-blue-800 underline"
              >
                Volver a entrar
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <div
            className="mb-6 flex rounded-full bg-slate-200 p-1 text-sm font-semibold"
            role="tablist"
          >
            {TABS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => setMode(value)}
                className={`flex-1 rounded-full py-2.5 ${mode === value ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === 'signIn' ? (
            <SignInForm onForgotPassword={() => setMode('reset')} />
          ) : (
            <SignUpForm />
          )}
        </>
      )}
    </div>
  )
}
