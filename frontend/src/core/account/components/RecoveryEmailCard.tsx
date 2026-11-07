// Optional recovery email of the account: lets the user reset the password by email if they lose
// their recovery code. Nobody in the team sees it.
import { useEffect, useState, type FormEvent } from 'react'
import { getRecoveryEmail, setRecoveryEmail } from '@/core/auth/accounts'
import { Card } from '@/shared/ui/Card'
import { ERROR_CLASS, INPUT_CLASS, PRIMARY_BUTTON_CLASS } from '@/shared/ui/form'

export function RecoveryEmailCard() {
  const [saved, setSaved] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getRecoveryEmail()
      .then((current) => {
        setSaved(current)
        setEmail(current ?? '')
      })
      .catch(() => setMessage({ ok: false, text: 'No se ha podido cargar tu correo.' }))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await setRecoveryEmail(email)
      setSaved(email.trim() || null)
      setMessage({ ok: true, text: email.trim() ? 'Correo guardado.' : 'Correo quitado.' })
    } catch {
      setMessage({ ok: false, text: 'Ese correo no parece válido.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="font-semibold">Correo de recuperación</p>
        <p className="text-sm text-slate-600">
          Opcional. Si pierdes tu código, te enviaremos aquí un enlace para poner otra contraseña.
          Nadie del equipo lo ve.
        </p>
        <input
          className={INPUT_CLASS}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="tu@correo.com"
        />
        {message && (
          <p className={message.ok ? 'text-sm text-emerald-700' : ERROR_CLASS}>{message.text}</p>
        )}
        <button
          type="submit"
          disabled={busy || email.trim() === (saved ?? '')}
          className={PRIMARY_BUTTON_CLASS}
        >
          {busy ? 'Guardando…' : email.trim() || !saved ? 'Guardar correo' : 'Quitar correo'}
        </button>
      </form>
    </Card>
  )
}
