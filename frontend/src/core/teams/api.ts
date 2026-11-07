// Server calls for the user's teams: list, team settings, create and join with a code.
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/core/query/queryClient'
import { supabase } from '@/core/supabase/client'
import { toMyTeam, toTeam, type MyTeamRow, type TeamRow } from '@/shared/domain/rows'

export const MY_TEAMS_KEY = ['my-teams']

/** Teams of the signed-in user with their role, including pending ones. */
export function useMyTeams() {
  return useQuery({
    queryKey: MY_TEAMS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_teams')
      if (error) throw error
      return (data as MyTeamRow[]).map(toMyTeam)
    },
  })
}

/** Team settings (default system, enabled modules). Only readable once the user is accepted. */
export function useTeam(teamId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['team', teamId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('*').eq('id', teamId).single()
      if (error) throw error
      return toTeam(data as TeamRow)
    },
  })
}

export function useCreateTeam() {
  return useMutation({
    mutationFn: async (input: { name: string; category: string; season: string }) => {
      const { data, error } = await supabase.rpc('create_team', input)
      if (error) throw error
      return data as string
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_TEAMS_KEY }),
  })
}

/** Leaves a team. The database refuses it for the last coach (they must hand the team over first). */
export function useLeaveTeam() {
  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_TEAMS_KEY }),
  })
}

/** Joins with a code. Fails with code `P0002` when the code does not exist or is inactive. */
export function useJoinTeam() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('join_team', { join_code: code })
      if (error) throw error
      return data as string
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MY_TEAMS_KEY }),
  })
}
