/** Fixed position values (see SPEC "Modelo de datos inicial"). */
export type Position = 'setter' | 'outside' | 'middle' | 'opposite' | 'libero'

export type AvailabilityStatus = 'yes' | 'no' | 'maybe'

export type GameSystem = '5-1' | '6-0' | '4-2' | '6-2' | '4-2-front'

export interface Team {
  id: string
  name: string
  category: string
  season: string
  defaultSystem: GameSystem
  /** Ids of the active modules, matching `ModuleDefinition.id`. */
  enabledModules: string[]
}

export interface Player {
  id: string
  firstName: string
  lastName: string
  birthYear: number
  number: number
  mainPosition: Position
  otherPositions: Position[]
}

export interface Match {
  id: string
  opponent: string
  /** Local date, `YYYY-MM-DD`. */
  date: string
  warmupTime: string
  matchTime: string
  venue: string
  mapsUrl: string
  homeAway: 'home' | 'away'
  notes?: string
}

export interface AvailabilityEntry {
  status: AvailabilityStatus
  comment?: string
}
