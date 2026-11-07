// Server calls of the results module: played matches and the unofficial league table.
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/core/query/queryClient'
import { supabase } from '@/core/supabase/client'
import { toMatch, type MatchRow } from '@/shared/domain/rows'
import type { LeagueRow } from './leagueTable'

const keys = {
  matches: (teamId: string) => ['matches', teamId],
  table: (teamId: string) => ['league-table', teamId],
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

/** The team's league table, or null if the coach has not added one. */
export function useLeagueTable(teamId: string) {
  return useQuery({
    queryKey: keys.table(teamId),
    queryFn: async () => {
      const row = check(
        await supabase
          .from('league_table')
          .select('rows, updated_at')
          .eq('team_id', teamId)
          .maybeSingle(),
      ) as { rows: LeagueRow[]; updated_at: string } | null
      return row ? ({ rows: row.rows, updatedAt: row.updated_at } as LeagueTable) : null
    },
  })
}

export function useSaveLeagueTable(teamId: string) {
  return useMutation({
    mutationFn: async (rows: LeagueRow[]) =>
      check(
        await supabase
          .from('league_table')
          .upsert({ team_id: teamId, rows, updated_at: new Date().toISOString() }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.table(teamId) }),
  })
}

export function useRemoveLeagueTable(teamId: string) {
  return useMutation({
    mutationFn: async () =>
      check(await supabase.from('league_table').delete().eq('team_id', teamId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.table(teamId) }),
  })
}
