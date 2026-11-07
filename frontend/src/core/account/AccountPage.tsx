// "Mi cuenta": new recovery code, recovery email, change password and sign out.
import { Link } from 'react-router'
import { useAuth } from '@/core/auth/auth'
import { SECONDARY_BUTTON_CLASS } from '@/shared/ui/form'
import { ChangePasswordCard } from './components/ChangePasswordCard'
import { RecoveryCodeCard } from './components/RecoveryCodeCard'
import { RecoveryEmailCard } from './components/RecoveryEmailCard'

export function AccountPage() {
  const { user, signOut } = useAuth()

  return (
    <section className="mx-auto max-w-md space-y-4">
      <Link to="/" className="text-sm font-medium text-blue-800">
        ← Mis equipos
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi cuenta</h1>
        <p className="text-sm text-slate-500">
          {user?.user_metadata.display_name} · usuario{' '}
          <strong>{user?.user_metadata.username}</strong>
        </p>
      </div>
      <RecoveryCodeCard />
      <RecoveryEmailCard />
      <ChangePasswordCard />
      <button type="button" onClick={signOut} className={`w-full ${SECONDARY_BUTTON_CLASS}`}>
        Cerrar sesión
      </button>
    </section>
  )
}
