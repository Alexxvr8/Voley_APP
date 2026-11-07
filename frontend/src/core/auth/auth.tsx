// Username/password auth on top of Supabase Auth. Usernames are mapped to an internal
// email address so players never need a real email (see spec "Registro y sesión").
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { queryClient } from '@/core/query/queryClient'
import { supabase } from '@/core/supabase/client'
import {
  createRecoveryCode,
  normalizeUsername,
  RecoveryRejectedError,
  setRecoveryEmail,
  usernameToEmail,
} from './accounts'

/**
 * Recovery code to show once, right after signing up or resetting the password.
 * `issuing` while it is being created, so the app does not flash in between.
 */
export type RecoveryNotice = { code: string } | 'issuing' | null

interface Auth {
  /** Undefined while the stored session is being restored. */
  user: User | null | undefined
  recoveryNotice: RecoveryNotice
  /** Hides the recovery code screen once the user has saved the code. */
  dismissRecoveryNotice: () => void
  signIn: (username: string, password: string) => Promise<void>
  /** `recoveryEmail` is optional; it lets the user reset the password by email later. */
  signUp: (
    username: string,
    displayName: string,
    password: string,
    recoveryEmail: string,
  ) => Promise<void>
  /** Sets a new password with the recovery code, signs in and shows the replacement code. */
  resetPassword: (username: string, code: string, newPassword: string) => Promise<void>
  /** Same, with the token of the reset email link instead of the recovery code. */
  resetPasswordWithEmail: (username: string, token: string, newPassword: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [recoveryNotice, setRecoveryNotice] = useState<RecoveryNotice>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null),
    )
    return () => data.subscription.unsubscribe()
  }, [])

  async function signIn(username: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    })
    if (error) throw error
  }

  async function signUp(
    username: string,
    displayName: string,
    password: string,
    recoveryEmail: string,
  ) {
    setRecoveryNotice('issuing')
    try {
      const { data, error } = await supabase.auth.signUp({
        email: usernameToEmail(username),
        password,
        options: {
          data: { username: normalizeUsername(username), display_name: displayName.trim() },
        },
      })
      if (error) throw error
      // Without a session the project still requires email confirmation, which cannot work here.
      if (!data.session) throw new Error('email_confirmation_enabled')
      if (recoveryEmail.trim()) await setRecoveryEmail(recoveryEmail)
      setRecoveryNotice({ code: await createRecoveryCode() })
    } catch (error) {
      setRecoveryNotice(null)
      throw error
    }
  }

  /** Runs a reset RPC; on success signs in with the new password and shows the new recovery code. */
  async function finishReset(
    rpc: string,
    args: Record<string, string>,
    username: string,
    newPassword: string,
  ) {
    const { data, error } = await supabase.rpc(rpc, args)
    if (error) throw error
    const result = data as { ok: boolean; code?: string }
    if (!result.ok || !result.code) throw new RecoveryRejectedError()
    setRecoveryNotice('issuing')
    try {
      await signIn(username, newPassword)
      setRecoveryNotice({ code: result.code })
    } catch (signInError) {
      setRecoveryNotice(null)
      throw signInError
    }
  }

  async function resetPassword(username: string, code: string, newPassword: string) {
    const args = { username: normalizeUsername(username), code, new_password: newPassword }
    await finishReset('reset_password_with_code', args, username, newPassword)
  }

  async function resetPasswordWithEmail(username: string, token: string, newPassword: string) {
    const args = { username: normalizeUsername(username), token, new_password: newPassword }
    await finishReset('reset_password_with_email_token', args, username, newPassword)
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    // Offline, revoking the session server-side fails; still sign out on this device.
    if (error) await supabase.auth.signOut({ scope: 'local' })
    // The next account must not see this account's cached teams.
    queryClient.clear()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        recoveryNotice,
        dismissRecoveryNotice: () => setRecoveryNotice(null),
        signIn,
        signUp,
        resetPassword,
        resetPasswordWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside AuthProvider')
  return auth
}
