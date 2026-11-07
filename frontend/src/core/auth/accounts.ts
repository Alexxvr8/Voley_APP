// Account helpers without React: username rules, the internal email and the recovery calls
// (recovery code, recovery email and the reset email request).
import { supabase } from '@/core/supabase/client'

const INTERNAL_EMAIL_DOMAIN = 'voley.local'

/** Same rule as the `profiles.username` check constraint. */
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/

export const MIN_PASSWORD_LENGTH = 6

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${INTERNAL_EMAIL_DOMAIN}`
}

/** Thrown by `resetPassword` when the username, code or lock state does not allow the reset. */
export class RecoveryRejectedError extends Error {
  constructor() {
    super('recovery_rejected')
  }
}

/** Saves (or with an empty string removes) the signed-in user's recovery email. */
export async function setRecoveryEmail(email: string): Promise<void> {
  const { error } = await supabase.rpc('set_recovery_email', { email: email.trim() })
  if (error) throw error
}

/** The signed-in user's recovery email, or null. */
export async function getRecoveryEmail(): Promise<string | null> {
  const { data, error } = await supabase.rpc('my_recovery_email')
  if (error) throw error
  return data as string | null
}

/**
 * Asks the server to email a reset link. Resolves to `sent` (also when the username has no email,
 * so usernames cannot be probed) or `not_configured` while email sending is not set up.
 */
export async function requestResetEmail(username: string): Promise<'sent' | 'not_configured'> {
  const { data, error } = await supabase.functions.invoke('send-reset-email', {
    body: { username: normalizeUsername(username) },
  })
  if (error) throw error
  return (data as { reason?: string }).reason === 'not_configured' ? 'not_configured' : 'sent'
}

/** Creates a new recovery code for the signed-in user, replacing the old one. */
export async function createRecoveryCode(): Promise<string> {
  const { data, error } = await supabase.rpc('create_recovery_code')
  if (error) throw error
  return data as string
}
