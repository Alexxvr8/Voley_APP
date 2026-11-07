// Unofficial league table rows and their ordering (no React here).

/** One team's line in the table, typed in by the coach. */
export interface LeagueRow {
  team: string
  played: number
  won: number
  lost: number
  points: number
}

export const EMPTY_ROW: LeagueRow = { team: '', played: 0, won: 0, lost: 0, points: 0 }

/** Highest points first; on a tie, more matches won, then alphabetical. Rows without a name are dropped. */
export function sortTable(rows: LeagueRow[]): LeagueRow[] {
  return rows
    .filter((row) => row.team.trim() !== '')
    .map((row) => ({ ...row, team: row.team.trim() }))
    .sort((a, b) => b.points - a.points || b.won - a.won || a.team.localeCompare(b.team, 'es'))
}
