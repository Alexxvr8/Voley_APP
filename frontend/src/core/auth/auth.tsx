// Username/password auth on top of Supabase Auth. Usernames are mapped to an internal
// email address so players never need a real email (see SPEC "Registro y sesión").
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/core/supabase/client'

const INTERNAL_EMAIL_DOMAIN = 'voley.local'

/** Same rule as the `profiles.username` check constraint. */
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${INTERNAL_EMAIL_DOMAIN}`
}

interface Auth {
  /** Undefined while the stored session is being restored. */
  user: User | null | undefined
  signIn: (username: string, password: string) => Promise<void>
  signUp: (username: string, displayName: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  async function signIn(username: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password })
    if (error) throw error
  }

  async function signUp(username: string, displayName: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: { data: { username: normalizeUsername(username), display_name: displayName.trim() } },
    })
    if (error) throw error
    // Without a session the project still requires email confirmation, which cannot work here.
    if (!data.session) throw new Error('email_confirmation_enabled')
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    // Offline, revoking the session server-side fails; still sign out on this device.
    if (error) await supabase.auth.signOut({ scope: 'local' })
  }

  return <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside AuthProvider')
  return auth
}
