// Server calls of the results module: played matches and the unofficial league table of each season.
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/core/query/queryClient'
import { supabase } from '@/core/supabase/client'
import { toMatch, type MatchRow } from '@/shared/domain/rows'
import type { LeagueRow } from './leagueTable'

const keys = {
  matches: (teamId: string) => ['matches', teamId],
  table: (seasonId: string) => ['league-table', seasonId],
}

/** Throws the Supabase error, so TanStack Query marks the call as failed. */
function check<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw error
  return data
}

/** Same query as the calendar (shared cache); the page keeps the played ones. */
export function useMatches(teamId: string) {
  return useQuery({
    queryKey: keys.matches(teamId),
    queryFn: async () =>
      (
        check(
          await supabase
            .from('matches')
            .select('*')
            .eq('team_id', teamId)
            .neq('status', 'cancelled')
            .order('date'),
        ) as MatchRow[]
      ).map(toMatch),
  })
}

export interface LeagueTable {
  rows: LeagueRow[]
  /** When the coach last changed it (ISO). */
  updatedAt: string
}

/** A season's league table, or null if the coach has not added one. */
export function useLeagueTable(seasonId: string) {
  return useQuery({
    queryKey: keys.table(seasonId),
    queryFn: async () => {
      const row = check(
        await supabase
          .from('league_table')
          .select('rows, updated_at')
          .eq('season_id', seasonId)
          .maybeSingle(),
      ) as { rows: LeagueRow[]; updated_at: string } | null
      return row ? ({ rows: row.rows, updatedAt: row.updated_at } as LeagueTable) : null
    },
  })
}

export function useSaveLeagueTable(teamId: string, seasonId: string) {
  return useMutation({
    mutationFn: async (rows: LeagueRow[]) =>
      check(
        await supabase.from('league_table').upsert(
          {
            team_id: teamId,
            season_id: seasonId,
            rows,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'season_id' },
        ),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.table(seasonId) }),
  })
}

export function useRemoveLeagueTable(seasonId: string) {
  return useMutation({
    mutationFn: async () =>
      check(await supabase.from('league_table').delete().eq('season_id', seasonId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.table(seasonId) }),
  })
}
