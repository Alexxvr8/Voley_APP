// Text formatting helpers for dates and names, in Spanish.
import type { Player } from '@/shared/domain/types'

const dateFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
const longDateFormatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

/** Parses a `YYYY-MM-DD` string as a local date (avoids the UTC shift of `new Date(iso)`). */
function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** `2026-11-07` → `sáb, 7 nov`. */
export function formatShortDate(isoDate: string): string {
  return dateFormatter.format(parseLocalDate(isoDate))
}

/** `2026-11-07` → `sábado, 7 de noviembre`. */
export function formatLongDate(isoDate: string): string {
  return longDateFormatter.format(parseLocalDate(isoDate))
}

/** Full name as shown in lists: first name and last name. */
export function playerName(player: Player): string {
  return `${player.firstName} ${player.lastName}`
}
