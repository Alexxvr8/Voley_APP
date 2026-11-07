// Server data the set plan needs: the team's players, its matches and each match's call-ups.
// The plan itself still lives on the device only; saving it (and offline sync) arrives in phase 2.
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/core/supabase/client'
import { toCallup, type CallupRow } from '@/shared/domain/callups'
import { toMatch, toPlayer, type MatchRow, type PlayerRow } from '@/shared/domain/rows'

export function usePlayers(teamId: string) {
  return useQuery({
    queryKey: ['players', teamId],
    queryFn: async () => {
      const { data, error } = await supabase.from('players').select('*').eq('team_id', teamId)
      if (error) throw error
      return (data as PlayerRow[]).map(toPlayer)
    },
  })
}

export function useMatches(teamId: string) {
  return useQuery({
    queryKey: ['matches', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('team_id', teamId)
        .neq('status', 'cancelled')
        .order('date')
      if (error) throw error
      return (data as MatchRow[]).map(toMatch)
    },
  })
}

/** Called-up players with the number and position they use in this match. */
export function useCallups(matchId: string) {
  return useQuery({
    queryKey: ['callups', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('callups')
        .select('player_id, number, position')
        .eq('match_id', matchId)
      if (error) throw error
      return (data as CallupRow[]).map(toCallup)
    },
  })
}
