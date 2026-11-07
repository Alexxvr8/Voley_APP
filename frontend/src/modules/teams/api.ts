// Server calls of the team module. Each mutation refreshes the data it changes.
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/core/query/queryClient'
import { supabase } from '@/core/supabase/client'
import {
  toPlayer,
  toTrainingSlot,
  type PlayerRow,
  type TrainingSlotRow,
} from '@/shared/domain/rows'
import type { Position } from '@/shared/domain/types'
import { toMember, type MemberRow } from './members'

/** Role a join code lets in. */
export type CodeRole = 'player' | 'assistant'

export interface JoinCode {
  role: CodeRole
  code: string
  active: boolean
}

const keys = {
  codes: (teamId: string) => ['join-codes', teamId],
  members: (teamId: string) => ['members', teamId],
  players: (teamId: string) => ['players', teamId],
  slots: (teamId: string) => ['training-slots', teamId],
}

/** Throws the Supabase error, so TanStack Query marks the call as failed. */
function check<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw error
  return data
}

export function useJoinCodes(teamId: string) {
  return useQuery({
    queryKey: keys.codes(teamId),
    queryFn: async () =>
      check(
        await supabase.from('join_codes').select('role, code, active').eq('team_id', teamId),
      ) as JoinCode[],
  })
}

export function useRegenerateCode(teamId: string) {
  return useMutation({
    mutationFn: async (role: CodeRole) =>
      check(await supabase.rpc('regenerate_join_code', { team: teamId, code_role: role })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.codes(teamId) }),
  })
}

export function useSetCodeActive(teamId: string) {
  return useMutation({
    mutationFn: async ({ role, active }: { role: CodeRole; active: boolean }) =>
      check(
        await supabase.from('join_codes').update({ active }).eq('team_id', teamId).eq('role', role),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.codes(teamId) }),
  })
}

export function useMembers(teamId: string) {
  return useQuery({
    queryKey: keys.members(teamId),
    queryFn: async () =>
      (check(await supabase.rpc('team_members_overview', { team: teamId })) as MemberRow[]).map(
        toMember,
      ),
  })
}

export function useTeamPlayers(teamId: string) {
  return useQuery({
    queryKey: keys.players(teamId),
    queryFn: async () =>
      (check(await supabase.from('players').select('*').eq('team_id', teamId)) as PlayerRow[]).map(
        toPlayer,
      ),
  })
}

/** New roster entry created while accepting a player. */
export interface NewPlayer {
  firstName: string
  lastName: string
  number: number | null
  mainPosition: Position
}

/** Accepts a pending player, linking them to an existing roster entry or to a new one. */
export function useAcceptMember(teamId: string) {
  return useMutation({
    mutationFn: async ({
      member,
      playerId,
      newPlayer,
    }: {
      member: string
      playerId?: string
      newPlayer?: NewPlayer
    }) => {
      let player = playerId
      if (!player && newPlayer) {
        const created = check(
          await supabase
            .from('players')
            .insert({
              team_id: teamId,
              first_name: newPlayer.firstName,
              last_name: newPlayer.lastName,
              number: newPlayer.number,
              main_position: newPlayer.mainPosition,
            })
            .select('id')
            .single(),
        ) as { id: string }
        player = created.id
      }
      check(await supabase.rpc('accept_member', { team: teamId, member, player }))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.members(teamId) })
      queryClient.invalidateQueries({ queryKey: keys.players(teamId) })
    },
  })
}

/** Rejects a pending player or removes a member from the team. */
export function useRemoveMember(teamId: string) {
  return useMutation({
    mutationFn: async (member: string) =>
      check(
        await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', member),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.members(teamId) }),
  })
}

/** Sets a temporary password for a member who lost theirs; returns it to tell them. */
export function useCoachResetPassword(teamId: string) {
  return useMutation({
    mutationFn: async (member: string) =>
      check(await supabase.rpc('coach_reset_password', { team: teamId, member })) as string,
  })
}

export function useTrainingSlots(teamId: string) {
  return useQuery({
    queryKey: keys.slots(teamId),
    queryFn: async () =>
      (
        check(
          await supabase.from('training_slots').select('*').eq('team_id', teamId),
        ) as TrainingSlotRow[]
      ).map(toTrainingSlot),
  })
}

export function useAddTrainingSlot(teamId: string) {
  return useMutation({
    mutationFn: async (slot: {
      weekday: number
      startTime: string
      endTime: string
      venue: string
    }) =>
      check(
        await supabase.from('training_slots').insert({
          team_id: teamId,
          weekday: slot.weekday,
          start_time: slot.startTime,
          end_time: slot.endTime,
          venue: slot.venue,
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.slots(teamId) }),
  })
}

export function useDeleteTrainingSlot(teamId: string) {
  return useMutation({
    mutationFn: async (slotId: string) =>
      check(await supabase.from('training_slots').delete().eq('id', slotId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.slots(teamId) }),
  })
}

export interface TeamDetails {
  name: string
  category: string
  season: string
}

/** Renames the team or changes its category and season. Refreshes the menu and the team list. */
export function useUpdateTeamDetails(teamId: string) {
  return useMutation({
    mutationFn: async (details: TeamDetails) =>
      check(await supabase.from('teams').update(details).eq('id', teamId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] })
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
    },
  })
}
