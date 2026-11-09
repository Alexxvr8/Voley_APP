// Server calls of the team module. Each mutation refreshes the data it changes.
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/core/query/queryClient'
import { supabase } from '@/core/supabase/client'
import { seasonsKey } from '@/core/teams/api'
import {
  toPlayer,
  toTeamVenue,
  toTrainingSlot,
  type PlayerRow,
  type TrainingSlotRow,
} from '@/shared/domain/rows'
import type { GameSystem, PlayerInput, Position, Team } from '@/shared/domain/types'
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
  otherPositions: Position[]
}

/** Adds a roster entry without account (a player who does not use the app, or before they join). */
export function useAddPlayer(teamId: string) {
  return useMutation({
    mutationFn: async (player: PlayerInput) =>
      check(
        await supabase.from('players').insert({
          team_id: teamId,
          first_name: player.firstName,
          last_name: player.lastName,
          birth_year: player.birthYear,
          number: player.number,
          main_position: player.mainPosition,
          other_positions: player.otherPositions,
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.players(teamId) }),
  })
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
              other_positions: newPlayer.otherPositions,
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

/**
 * Merges two roster entries of the same person: account, answers, call-ups, training attendance and
 * set plans of `duplicate` move to `keep`, and `duplicate` is deleted. Coach only.
 */
export function useMergePlayers(teamId: string) {
  return useMutation({
    mutationFn: async ({ keep, duplicate }: { keep: string; duplicate: string }) =>
      check(await supabase.rpc('merge_players', { team: teamId, keep, duplicate })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.members(teamId) })
      queryClient.invalidateQueries({ queryKey: keys.players(teamId) })
      // Answers and call-ups of every match changed owner.
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      queryClient.invalidateQueries({ queryKey: ['callups'] })
      queryClient.invalidateQueries({ queryKey: ['training-answers', teamId] })
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
      mapsUrl: string
    }) =>
      check(
        await supabase.from('training_slots').insert({
          team_id: teamId,
          weekday: slot.weekday,
          start_time: slot.startTime,
          end_time: slot.endTime,
          venue: slot.venue,
          maps_url: slot.mapsUrl,
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
  /** System every new set starts with. */
  defaultSystem: GameSystem
}

/** Invalidates everything that shows the team's settings (menu, team list, team screens). */
function refreshTeam(teamId: string) {
  queryClient.invalidateQueries({ queryKey: ['my-teams'] })
  queryClient.invalidateQueries({ queryKey: ['team', teamId] })
}

/** Renames the team or changes its category, season or default system. */
export function useUpdateTeamDetails(teamId: string) {
  return useMutation({
    mutationFn: async (details: TeamDetails) =>
      check(
        await supabase
          .from('teams')
          .update({
            name: details.name,
            category: details.category,
            season: details.season,
            default_system: details.defaultSystem,
          })
          .eq('id', teamId),
      ),
    onSuccess: () => {
      refreshTeam(teamId)
      queryClient.invalidateQueries({ queryKey: seasonsKey(teamId) })
    },
  })
}

/**
 * Changes one field of the cached team at once (switches and colour react immediately) and goes back
 * if the server rejects it.
 */
function optimisticTeamUpdate<T>(teamId: string, apply: (team: Team, value: T) => Team) {
  const teamKey = ['team', teamId]
  return {
    onMutate: async (value: T) => {
      await queryClient.cancelQueries({ queryKey: teamKey })
      const previous = queryClient.getQueryData<Team>(teamKey)
      if (previous) queryClient.setQueryData(teamKey, apply(previous, value))
      return { previous }
    },
    onError: (_error: unknown, _value: T, context: { previous?: Team } | undefined) =>
      queryClient.setQueryData(teamKey, context?.previous),
    onSettled: () => refreshTeam(teamId),
  }
}

/** Which sections (modules) the team uses. */
export function useSetEnabledModules(teamId: string) {
  return useMutation({
    mutationFn: async (enabledModules: string[]) =>
      check(
        await supabase.from('teams').update({ enabled_modules: enabledModules }).eq('id', teamId),
      ),
    ...optimisticTeamUpdate<string[]>(teamId, (team, enabledModules) => ({
      ...team,
      enabledModules,
    })),
  })
}

/** Makes another member the coach; the current coach becomes segundo entrenador. */
export function useTransferTeam(teamId: string) {
  return useMutation({
    mutationFn: async (newCoach: string) =>
      check(await supabase.rpc('transfer_team', { team: teamId, new_coach: newCoach })),
    onSuccess: () => {
      refreshTeam(teamId)
      queryClient.invalidateQueries({ queryKey: keys.members(teamId) })
    },
  })
}

/** Deletes the team and everything in it. */
export function useDeleteTeam(teamId: string) {
  return useMutation({
    mutationFn: async () => check(await supabase.from('teams').delete().eq('id', teamId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-teams'] }),
  })
}

export function useTeamVenues(teamId: string) {
  return useQuery({
    queryKey: ['venues', teamId],
    queryFn: async () =>
      (
        check(
          await supabase
            .from('team_venues')
            .select('id, name, maps_url')
            .eq('team_id', teamId)
            .order('name'),
        ) as {
          id: string
          name: string
          maps_url: string
        }[]
      ).map(toTeamVenue),
  })
}

export function useAddVenue(teamId: string) {
  return useMutation({
    mutationFn: async (venue: { name: string; mapsUrl: string }) =>
      check(
        await supabase
          .from('team_venues')
          .insert({ team_id: teamId, name: venue.name, maps_url: venue.mapsUrl }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venues', teamId] }),
  })
}

export function useDeleteVenue(teamId: string) {
  return useMutation({
    mutationFn: async (venueId: string) =>
      check(await supabase.from('team_venues').delete().eq('id', venueId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['venues', teamId] }),
  })
}

export function useTeamOpponents(teamId: string) {
  return useQuery({
    queryKey: ['opponents', teamId],
    queryFn: async () =>
      check(
        await supabase
          .from('team_opponents')
          .select('id, name')
          .eq('team_id', teamId)
          .order('name'),
      ) as {
        id: string
        name: string
      }[],
  })
}

export function useAddOpponent(teamId: string) {
  return useMutation({
    mutationFn: async (name: string) =>
      check(await supabase.from('team_opponents').insert({ team_id: teamId, name })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['opponents', teamId] }),
  })
}

export function useDeleteOpponent(teamId: string) {
  return useMutation({
    mutationFn: async (opponentId: string) =>
      check(await supabase.from('team_opponents').delete().eq('id', opponentId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['opponents', teamId] }),
  })
}

export function useSetTeamColor(teamId: string) {
  return useMutation({
    mutationFn: async (color: string) =>
      check(await supabase.from('teams').update({ color }).eq('id', teamId)),
    ...optimisticTeamUpdate<string>(teamId, (team, color) => ({ ...team, color })),
  })
}

/**
 * Starts a new season: it becomes the current one and the given roster entries leave the team
 * (they keep their history; players with an account lose access).
 */
export function useStartSeason(teamId: string) {
  return useMutation({
    mutationFn: async ({ name, leaving }: { name: string; leaving: string[] }) =>
      check(
        await supabase.rpc('start_season', { team: teamId, season_name: name, leaving }),
      ) as string,
    onSuccess: () => {
      refreshTeam(teamId)
      queryClient.invalidateQueries({ queryKey: seasonsKey(teamId) })
      queryClient.invalidateQueries({ queryKey: keys.players(teamId) })
      queryClient.invalidateQueries({ queryKey: keys.members(teamId) })
    },
  })
}

/** Brings a leaver back to the roster (or marks someone as leaver by hand). */
export function useSetPlayerActive(teamId: string) {
  return useMutation({
    mutationFn: async ({ playerId, active }: { playerId: string; active: boolean }) =>
      check(await supabase.from('players').update({ active }).eq('id', playerId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.players(teamId) }),
  })
}
