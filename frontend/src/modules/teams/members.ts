// Team member shape returned by `team_members_overview()` and helpers to split it (no React here).
import type { TeamRole } from '@/shared/domain/types'

export interface Member {
  userId: string
  username: string
  displayName: string
  role: TeamRole
  /** Linked roster entry; null for a pending player (or staff without a roster entry). */
  playerId: string | null
}

export interface MemberRow {
  user_id: string
  username: string
  display_name: string
  role: string
  player_id: string | null
}

export function toMember(row: MemberRow): Member {
  return {
    userId: row.user_id,
    username: row.username,
    displayName: row.display_name,
    role: row.role as TeamRole,
    playerId: row.player_id,
  }
}

/** Players who joined with a code and wait for the coach. */
export function pendingMembers(members: Member[]): Member[] {
  return members.filter((member) => member.role === 'player' && member.playerId === null)
}

export function activeMembers(members: Member[]): Member[] {
  return members.filter((member) => !(member.role === 'player' && member.playerId === null))
}

/** Roster entry ids already linked to an account, so they are not offered twice. */
export function linkedPlayerIds(members: Member[]): Set<string> {
  return new Set(members.flatMap((member) => (member.playerId ? [member.playerId] : [])))
}
