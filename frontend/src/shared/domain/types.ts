// Domain types shared by every module. Field values match the database (see backend/README.md).
/** Fixed position values (see spec "Modelo de datos inicial"). */
export type Position = 'setter' | 'outside' | 'middle' | 'opposite' | 'libero'

export type AvailabilityStatus = 'yes' | 'no' | 'maybe'

export type GameSystem = '5-1' | '6-0' | '4-2' | '6-2'

/** Team role, ordered from least to most privileged (see spec "Permisos por rol"). */
export type TeamRole = 'player' | 'assistant' | 'coach'

export interface Team {
  id: string
  name: string
  category: string
  season: string
  defaultSystem: GameSystem
  /** Ids of the active modules, matching `ModuleDefinition.id`. */
  enabledModules: string[]
}

/** One of the current user's teams, as listed after signing in. */
export interface MyTeam {
  id: string
  name: string
  category: string
  season: string
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
  birthYear: number | null
  number: number | null
  mainPosition: Position
  otherPositions: Position[]
  /** False for players who only train: they are left out of availability and call-ups. */
  competes: boolean
}

export interface Match {
  id: string
  opponent: string
  /** Local date, `YYYY-MM-DD`. */
  date: string
  /** `HH:MM`, empty if not set. */
  warmupTime: string
  matchTime: string
  venue: string
  mapsUrl: string
  homeAway: 'home' | 'away'
  notes: string
}

/** A called-up player and the number/position they use in that match (null = the roster value). */
export interface Callup {
  playerId: string
  number: number | null
  position: Position | null
}

export interface AvailabilityEntry {
  status: AvailabilityStatus
  comment?: string
}

/** A weekly training: every `weekday` (1 = Monday … 7 = Sunday) from `startTime` to `endTime`. */
export interface TrainingSlot {
  id: string
  weekday: number
  startTime: string
  endTime: string
  venue: string
}

/** A training slot that does not happen on one specific date. */
export interface TrainingCancellation {
  slotId: string
  date: string
}
