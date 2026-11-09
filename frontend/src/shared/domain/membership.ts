// Who is expected where, depending on how each roster entry belongs to the team (no React here):
// members always, regulars on their weekdays (and any match), one-offs only on their day.
import { parseLocalDate } from '@/shared/utils/format'
import type { Membership, Player } from './types'

export const MEMBERSHIP_LABELS: Record<Membership, string> = {
  member: 'Del equipo',
  regular: 'Viene algunos días',
  one_off: 'Día suelto',
}

/** 1 = Monday … 7 = Sunday, for a local `YYYY-MM-DD` date. */
function weekdayOf(isoDate: string): number {
  return ((parseLocalDate(isoDate).getDay() + 6) % 7) + 1
}

/** Can be called up to (and answer) a match on `matchDate`: competing players still in the team. */
export function playsMatchOn(player: Player, matchDate: string): boolean {
  if (!player.active || !player.competes) return false
  return player.membership !== 'one_off' || player.visitDate === matchDate
}

/** Is asked about (and counted in) a training on `date`. */
export function trainsOn(player: Player, date: string): boolean {
  if (!player.active) return false
  if (player.membership === 'regular') return player.visitWeekdays.includes(weekdayOf(date))
  if (player.membership === 'one_off') return player.visitDate === date
  return true
}

/** Part of the team itself (not a guest), still active. */
export function isTeamMember(player: Player): boolean {
  return player.active && player.membership === 'member'
}

/** How an entry belongs to the team, as edited in the player form. */
export interface MembershipValue {
  membership: Membership
  visitWeekdays: number[]
  visitDate: string | null
}

/** Whether the chosen membership has the details it needs (some day, or the date). */
export function membershipComplete({ membership, visitWeekdays, visitDate }: MembershipValue) {
  if (membership === 'regular') return visitWeekdays.length > 0
  if (membership === 'one_off') return visitDate !== null
  return true
}
