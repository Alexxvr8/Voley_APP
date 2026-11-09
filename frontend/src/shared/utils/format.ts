// Text formatting helpers for dates and names, in Spanish.
import type { Player, Season } from '@/shared/domain/types'

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

/** 45 → `45 min`, 60 → `1 h`, 75 → `1 h 15 min`. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

/** `18:00` minus 45 minutes → `17:15`. */
export function timeMinus(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const total = (((hours * 60 + mins - minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Warm-up as shown to the team: `45 min (desde 17:15)`, or just `45 min` without a match time. */
export function formatWarmup(minutes: number | null, matchTime: string): string {
  if (!minutes) return ''
  const duration = formatDuration(minutes)
  return matchTime ? `${duration} (desde ${timeMinus(matchTime, minutes)})` : duration
}

/** Name shown for a season; a season without a name shows its start year. */
export function seasonLabel(season: Season): string {
  return season.name || `Temporada ${season.startedOn.slice(0, 4)}`
}
