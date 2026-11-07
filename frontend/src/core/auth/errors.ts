// Maps auth and recovery errors to messages a young player can understand.
import { isAuthError } from '@supabase/supabase-js'
import { MIN_PASSWORD_LENGTH, RecoveryRejectedError } from './accounts'

export function authErrorMessage(error: unknown): string {
  if (error instanceof RecoveryRejectedError) {
    return 'El usuario o el código de recuperación no son correctos. Tras 5 intentos fallidos hay que esperar 15 minutos.'
  }
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

/** Checks a new password and its confirmation; returns the problem to show, or null if fine. */
export function newPasswordProblem(password: string, confirmation: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
  }
  if (password !== confirmation) return 'Las dos contraseñas no coinciden.'
  return null
}
