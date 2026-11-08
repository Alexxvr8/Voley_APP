// Server calls of the roster module: players of the team, edit or delete a player and switch
// "compite". New entries without account are added from Ajustes (teams module).
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/core/query/queryClient'
import { supabase } from '@/core/supabase/client'
import { toPlayer, type PlayerRow } from '@/shared/domain/rows'
import type { PlayerInput } from '@/shared/domain/types'

const playersKey = (teamId: string) => ['players', teamId]

const playersQuery = (teamId: string) => ({
  queryKey: playersKey(teamId),
  queryFn: async () => {
    const { data, error } = await supabase.from('players').select('*').eq('team_id', teamId)
    if (error) throw error
    return (data as PlayerRow[]).map(toPlayer)
  },
})

export function usePlayers(teamId: string) {
  return useQuery(playersQuery(teamId))
}

/** Downloads the roster so it can be read offline. It prepares no match of its own. */
export async function prepareRosterOffline(teamId: string): Promise<string[]> {
  await queryClient.fetchQuery({ ...playersQuery(teamId), staleTime: 0 })
  return []
}

export function useUpdatePlayer(teamId: string, playerId: string) {
  return useMutation({
    mutationFn: async (player: PlayerInput) => {
      const { error } = await supabase
        .from('players')
        .update({
          first_name: player.firstName,
          last_name: player.lastName,
          birth_year: player.birthYear,
          number: player.number,
          main_position: player.mainPosition,
          other_positions: player.otherPositions,
        })
        .eq('id', playerId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: playersKey(teamId) }),
  })
}

/** Deletes a roster entry with its answers and call-ups. A linked account goes back to pending. */
export function useDeletePlayer(teamId: string) {
  return useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase.from('players').delete().eq('id', playerId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: playersKey(teamId) }),
  })
}

/** Marks a player as competing or as "only trains" (left out of availability and call-ups). */
export function useSetCompetes(teamId: string) {
  return useMutation({
    mutationFn: async ({ playerId, competes }: { playerId: string; competes: boolean }) => {
      const { error } = await supabase.from('players').update({ competes }).eq('id', playerId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: playersKey(teamId) }),
  })
}
