// Text formatting helpers for dates and names, in Spanish.
import type { Player } from '@/shared/domain/types'

const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const longDateFormatter = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

/** Parses a `YYYY-MM-DD` string as a local date (avoids the UTC shift of `new Date(iso)`). */
export function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Local date → `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Today as `YYYY-MM-DD`, in local time. */
export function todayIso(): string {
  return toIsoDate(new Date())
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
  return `${player.firstName} ${player.lastName}`.trim()
}

/** Shirt number for display; a dash when the player has none yet. */
export function shirtNumber(player: Player): string {
  return player.number === null ? '–' : String(player.number)
}

/** Sorts players by shirt number, players without number last. */
export function byShirtNumber(a: Player, b: Player): number {
  return (a.number ?? 1000) - (b.number ?? 1000)
}
