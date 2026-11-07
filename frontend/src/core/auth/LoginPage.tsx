// Screen shown without a session: sign in, create an account or reset a forgotten password.
import { useState } from 'react'
import { ResetPasswordForm } from './components/ResetPasswordForm'
import { SignInForm } from './components/SignInForm'
import { SignUpForm } from './components/SignUpForm'

type Mode = 'signIn' | 'signUp' | 'reset'

const TABS: [Mode, string][] = [
  ['signIn', 'Entrar'],
  ['signUp', 'Crear cuenta'],
]

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('signIn')

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
          <ResetPasswordForm onBack={() => setMode('signIn')} />
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
