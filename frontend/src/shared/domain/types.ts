// Domain types shared by every module. Field values match the database (see backend/README.md).
/** Fixed position values (see spec "Modelo de datos inicial"). */
export type Position = 'setter' | 'outside' | 'middle' | 'opposite' | 'libero'

export type AvailabilityStatus = 'yes' | 'no' | 'maybe'

/**
 * How a roster entry belongs to the team: `member` (part of the team), `regular` (comes on some
 * weekdays, e.g. a younger player who trains on Mondays) or `one_off` (comes on one specific day).
 */
export type Membership = 'member' | 'regular' | 'one_off'

export type GameSystem = '5-1' | '6-0' | '4-2' | '6-2'

/** Team role, ordered from least to most privileged (see spec "Permisos por rol"). */
export type TeamRole = 'player' | 'assistant' | 'coach'

export interface Team {
  id: string
  name: string
  category: string
  season: string
  /** Base colour shown next to the team name in the menu, `#rrggbb`. */
  color: string
  defaultSystem: GameSystem
  /** Ids of the active modules, matching `ModuleDefinition.id`. */
  enabledModules: string[]
  /** Whether players see the season MVP ranking (the coach always does). */
  mvpRankingVisible: boolean
  /** Season new matches go to; `season` is its name. */
  currentSeasonId: string
}

/** A season of a team. Matches, results, league table and MVP ranking are per season. */
export interface Season {
  id: string
  name: string
  /** Local date, `YYYY-MM-DD`. */
  startedOn: string
}

/** One of the current user's teams, as listed after signing in. */
export interface MyTeam {
  id: string
  name: string
  category: string
  season: string
  color: string
  role: TeamRole
  /** Roster entry linked to the user's account in this team, if any. */
  playerId: string | null
  /** A player who joined with a code and is waiting for the coach to accept them. */
  pending: boolean
}

export interface Player {
  id: string
  firstName: string
  lastName: string
  /** Short name the staff chose ("Solis", "Rodri"); empty if none. */
  nickname: string
  birthYear: number | null
  number: number | null
  mainPosition: Position
  otherPositions: Position[]
  /** False for players who only train: they are left out of availability and call-ups. */
  competes: boolean
  /**
   * False for players who left the team at the start of a season ("bajas"): kept only for their
   * history (past call-ups, MVP…), out of the roster and of every current list.
   */
  active: boolean
  membership: Membership
  /** Weekdays a `regular` comes (1 = Monday … 7 = Sunday). */
  visitWeekdays: number[]
  /** Day a `one_off` comes, `YYYY-MM-DD`. */
  visitDate: string | null
}

/** Points of one set, from the team's point of view. */
export interface SetScore {
  us: number
  them: number
}

export type MatchStatus = 'scheduled' | 'played' | 'cancelled'

/**
 * MVP vote of a match: `closed` (never opened), `open`, `tie_pending` (closed with a tie the coach
 * has to resolve) or `finished` (winners known, possibly none if nobody voted).
 */
export type MvpStatus = 'closed' | 'open' | 'tie_pending' | 'finished'

/** How many sets a match has: best of 5 or 3, or a fixed number of sets that are always played. */
export type SetsFormat = 'best_of_5' | 'best_of_3' | 'fixed_3' | 'fixed_1'

/** Sets won by each side, from the team's point of view. */
export interface FinalScore {
  us: number
  them: number
}

export interface Match {
  id: string
  seasonId: string
  opponent: string
  /** Local date, `YYYY-MM-DD`. */
  date: string
  /** `HH:MM`, empty if not set. */
  matchTime: string
  /** Warm-up before the match, in minutes (multiples of 15); null if not set. */
  warmupMinutes: number | null
  venue: string
  mapsUrl: string
  homeAway: 'home' | 'away'
  notes: string
  status: MatchStatus
  /** One entry per set played; empty until the result is recorded or when only the score is known. */
  setsResult: SetScore[]
  setsFormat: SetsFormat
  /** Sets won when only the final score was recorded ("2-1"), without the points of each set. */
  finalScore: FinalScore | null
  mvpStatus: MvpStatus
  /** When the MVP vote closes or closed (ISO), null if it never opened. */
  mvpClosesAt: string | null
  /** Roster ids of the MVP (several = co-MVP); empty until the vote is finished. */
  mvpWinners: string[]
}

/** A called-up player and the number/positions they use in that match (null = the roster values). */
export interface Callup {
  playerId: string
  number: number | null
  /** Positions the player can cover in this match; the first one is shown as the main one. */
  positions: Position[] | null
}

export interface AvailabilityEntry {
  status: AvailabilityStatus
  comment?: string
}

/** One of the team's usual venues, picked when creating matches and trainings. */
export interface TeamVenue {
  id: string
  name: string
  mapsUrl: string
}

/** A weekly training: every `weekday` (1 = Monday … 7 = Sunday) from `startTime` to `endTime`. */
export interface TrainingSlot {
  id: string
  weekday: number
  startTime: string
  endTime: string
  venue: string
  mapsUrl: string
}

/** Editable fields of a roster entry, as filled in the player form. */
export interface PlayerInput {
  firstName: string
  lastName: string
  nickname: string
  birthYear: number | null
  number: number | null
  mainPosition: Position
  otherPositions: Position[]
  membership: Membership
  visitWeekdays: number[]
  visitDate: string | null
}

/** A player's answer for one training on one date. */
export interface TrainingAnswer {
  slotId: string
  date: string
  playerId: string
  status: AvailabilityStatus
}

/** A training slot that does not happen on one specific date. */
export interface TrainingCancellation {
  slotId: string
  date: string
}
