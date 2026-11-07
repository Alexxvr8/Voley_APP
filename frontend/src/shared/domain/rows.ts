// Converts database rows (snake_case, as returned by Supabase) into the domain types used by the UI.
import type {
  GameSystem,
  Match,
  MatchStatus,
  MyTeam,
  Player,
  Position,
  SetScore,
  Team,
  TeamRole,
  TrainingCancellation,
  TrainingSlot,
} from './types'

/** `18:00:00` → `18:00`; null → empty string. */
function shortTime(time: string | null): string {
  return time ? time.slice(0, 5) : ''
}

export interface TeamRow {
  id: string
  name: string
  category: string
  season: string
  default_system: string
  enabled_modules: string[]
}

export function toTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    season: row.season,
    defaultSystem: row.default_system as GameSystem,
    enabledModules: row.enabled_modules,
  }
}

/** Row returned by the `my_teams()` RPC. */
export interface MyTeamRow {
  team_id: string
  name: string
  category: string
  season: string
  role: string
  player_id: string | null
  pending: boolean
}

export function toMyTeam(row: MyTeamRow): MyTeam {
  return {
    id: row.team_id,
    name: row.name,
    category: row.category,
    season: row.season,
    role: row.role as TeamRole,
    playerId: row.player_id,
    pending: row.pending,
  }
}

export interface PlayerRow {
  id: string
  first_name: string
  last_name: string
  birth_year: number | null
  number: number | null
  main_position: string
  other_positions: string[]
  competes: boolean
}

export function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    birthYear: row.birth_year,
    number: row.number,
    mainPosition: row.main_position as Position,
    otherPositions: row.other_positions as Position[],
    competes: row.competes,
  }
}

export interface MatchRow {
  id: string
  opponent: string
  date: string
  warmup_time: string | null
  match_time: string | null
  venue: string
  maps_url: string
  home_away: string
  notes: string
  status: string
  sets_result: SetScore[]
}

export function toMatch(row: MatchRow): Match {
  return {
    id: row.id,
    opponent: row.opponent,
    date: row.date,
    warmupTime: shortTime(row.warmup_time),
    matchTime: shortTime(row.match_time),
    venue: row.venue,
    mapsUrl: row.maps_url,
    homeAway: row.home_away === 'away' ? 'away' : 'home',
    notes: row.notes,
    status: row.status as MatchStatus,
    setsResult: row.sets_result,
  }
}

export interface TrainingSlotRow {
  id: string
  weekday: number
  start_time: string
  end_time: string
  venue: string
  maps_url: string
}

export function toTrainingSlot(row: TrainingSlotRow): TrainingSlot {
  return {
    id: row.id,
    weekday: row.weekday,
    startTime: shortTime(row.start_time),
    endTime: shortTime(row.end_time),
    venue: row.venue,
    mapsUrl: row.maps_url,
  }
}

export function toTrainingCancellation(row: {
  slot_id: string
  date: string
}): TrainingCancellation {
  return { slotId: row.slot_id, date: row.date }
}
