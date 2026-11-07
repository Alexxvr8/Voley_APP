// Signed-in user's name with the sign-out action.
import { useAuth } from '@/core/auth/auth'

export function AccountButton() {
  const { user, signOut } = useAuth()

  return (
    <button
      type="button"
      onClick={signOut}
      className="text-xs text-blue-200 underline hover:text-white"
    >
      {user?.user_metadata.display_name ?? 'Cuenta'} · Salir
    </button>
  )
}
