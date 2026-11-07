// Server calls of the matches module: matches, trainings for the calendar, availability and call-ups.
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/core/query/queryClient'
import { supabase } from '@/core/supabase/client'
import {
  toMatch,
  toPlayer,
  toTrainingCancellation,
  toTrainingSlot,
  type MatchRow,
  type PlayerRow,
  type TrainingSlotRow,
} from '@/shared/domain/rows'
import { toCallup, type CallupRow } from '@/shared/domain/callups'
import type { AvailabilityEntry, AvailabilityStatus, Callup } from '@/shared/domain/types'

const keys = {
  matches: (teamId: string) => ['matches', teamId],
  players: (teamId: string) => ['players', teamId],
  slots: (teamId: string) => ['training-slots', teamId],
  cancellations: (teamId: string) => ['training-cancellations', teamId],
  availability: (matchId: string) => ['availability', matchId],
  myAvailability: (playerId: string) => ['my-availability', playerId],
  callups: (matchId: string) => ['callups', matchId],
  myCallups: (playerId: string) => ['my-callups', playerId],
}

/** Throws the Supabase error, so TanStack Query marks the call as failed. */
function check<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw error
  return data
}

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

export function usePlayers(teamId: string) {
  return useQuery({
    queryKey: keys.players(teamId),
    queryFn: async () =>
      (check(await supabase.from('players').select('*').eq('team_id', teamId)) as PlayerRow[]).map(
        toPlayer,
      ),
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

export function useTrainingCancellations(teamId: string) {
  return useQuery({
    queryKey: keys.cancellations(teamId),
    queryFn: async () =>
      (
        check(
          await supabase
            .from('training_cancellations')
            .select('slot_id, date, training_slots!inner(team_id)')
            .eq('training_slots.team_id', teamId),
        ) as { slot_id: string; date: string }[]
      ).map(toTrainingCancellation),
  })
}

/** Cancels a weekly training for one date, or brings it back. Staff only. */
export function useSetTrainingCancelled(teamId: string) {
  return useMutation({
    mutationFn: async ({
      slotId,
      date,
      cancelled,
    }: {
      slotId: string
      date: string
      cancelled: boolean
    }) =>
      check(
        cancelled
          ? await supabase.from('training_cancellations').insert({ slot_id: slotId, date })
          : await supabase
              .from('training_cancellations')
              .delete()
              .eq('slot_id', slotId)
              .eq('date', date),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.cancellations(teamId) }),
  })
}

/** Every answer for a match, by player id. */
export function useAvailability(matchId: string) {
  return useQuery({
    queryKey: keys.availability(matchId),
    queryFn: async () => {
      const rows = check(
        await supabase
          .from('availability')
          .select('player_id, status, comment')
          .eq('match_id', matchId),
      ) as { player_id: string; status: AvailabilityStatus; comment: string }[]
      return Object.fromEntries(
        rows.map((row) => [row.player_id, { status: row.status, comment: row.comment }]),
      ) as Record<string, AvailabilityEntry>
    },
  })
}

/** The current player's answers, by match id (for the calendar list). */
export function useMyAvailability(playerId: string | null) {
  return useQuery({
    queryKey: keys.myAvailability(playerId ?? ''),
    enabled: playerId !== null,
    queryFn: async () => {
      const rows = check(
        await supabase.from('availability').select('match_id, status').eq('player_id', playerId!),
      ) as { match_id: string; status: AvailabilityStatus }[]
      return Object.fromEntries(rows.map((row) => [row.match_id, row.status])) as Record<
        string,
        AvailabilityStatus
      >
    },
  })
}

/** Saves a player's answer. The buttons update at once and go back if the server rejects it. */
export function useSetAvailability() {
  return useMutation({
    mutationFn: async ({
      matchId,
      playerId,
      status,
    }: {
      matchId: string
      playerId: string
      status: AvailabilityStatus
    }) =>
      check(
        await supabase.from('availability').upsert({
          match_id: matchId,
          player_id: playerId,
          status,
          updated_at: new Date().toISOString(),
        }),
      ),
    onMutate: async ({ matchId, playerId, status }) => {
      const matchKey = keys.availability(matchId)
      const playerKey = keys.myAvailability(playerId)
      await queryClient.cancelQueries({ queryKey: matchKey })
      await queryClient.cancelQueries({ queryKey: playerKey })
      const previous = {
        match: queryClient.getQueryData<Record<string, AvailabilityEntry>>(matchKey),
        player: queryClient.getQueryData<Record<string, AvailabilityStatus>>(playerKey),
      }
      queryClient.setQueryData(matchKey, { ...previous.match, [playerId]: { status } })
      queryClient.setQueryData(playerKey, { ...previous.player, [matchId]: status })
      return previous
    },
    onError: (_error, { matchId, playerId }, previous) => {
      queryClient.setQueryData(keys.availability(matchId), previous?.match)
      queryClient.setQueryData(keys.myAvailability(playerId), previous?.player)
    },
    onSettled: (_data, _error, { matchId, playerId }) => {
      queryClient.invalidateQueries({ queryKey: keys.availability(matchId) })
      queryClient.invalidateQueries({ queryKey: keys.myAvailability(playerId) })
    },
  })
}

/** Called-up players of a match, with their per-match number and position. */
export function useCallups(matchId: string) {
  return useQuery({
    queryKey: keys.callups(matchId),
    queryFn: async () =>
      (
        check(
          await supabase
            .from('callups')
            .select('player_id, number, position')
            .eq('match_id', matchId),
        ) as CallupRow[]
      ).map(toCallup),
  })
}

/** Ids of the matches the current player is called up for. */
export function useMyCallups(playerId: string | null) {
  return useQuery({
    queryKey: keys.myCallups(playerId ?? ''),
    enabled: playerId !== null,
    queryFn: async () =>
      (
        check(await supabase.from('callups').select('match_id').eq('player_id', playerId!)) as {
          match_id: string
        }[]
      ).map((row) => row.match_id),
  })
}

/** Calls a player up or removes them. The checkbox updates at once and goes back if the server rejects it. */
export function useSetCalledUp(matchId: string) {
  const callupsKey = keys.callups(matchId)
  return useMutation({
    mutationFn: async ({ playerId, calledUp }: { playerId: string; calledUp: boolean }) =>
      check(
        calledUp
          ? await supabase.from('callups').insert({ match_id: matchId, player_id: playerId })
          : await supabase
              .from('callups')
              .delete()
              .eq('match_id', matchId)
              .eq('player_id', playerId),
      ),
    onMutate: async ({ playerId, calledUp }) => {
      await queryClient.cancelQueries({ queryKey: callupsKey })
      const previous = queryClient.getQueryData<Callup[]>(callupsKey) ?? []
      const others = previous.filter((callup) => callup.playerId !== playerId)
      queryClient.setQueryData(
        callupsKey,
        calledUp ? [...others, { playerId, number: null, position: null }] : others,
      )
      return previous
    },
    onError: (_error, _input, previous) => queryClient.setQueryData(callupsKey, previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: callupsKey }),
  })
}

export interface NewMatch {
  opponent: string
  date: string
  warmupTime: string
  matchTime: string
  venue: string
  mapsUrl: string
  homeAway: 'home' | 'away'
  notes: string
}

export function useCreateMatch(teamId: string) {
  return useMutation({
    mutationFn: async (match: NewMatch) =>
      (
        check(
          await supabase
            .from('matches')
            .insert({
              team_id: teamId,
              opponent: match.opponent,
              date: match.date,
              warmup_time: match.warmupTime || null,
              match_time: match.matchTime || null,
              venue: match.venue,
              maps_url: match.mapsUrl,
              home_away: match.homeAway,
              notes: match.notes,
            })
            .select('id')
            .single(),
        ) as { id: string }
      ).id,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.matches(teamId) }),
  })
}

/** Number and position a called-up player uses in this match only (null = the roster value). */
export function useSetCallupDetails(matchId: string) {
  const callupsKey = keys.callups(matchId)
  return useMutation({
    mutationFn: async ({ playerId, number, position }: Callup) =>
      check(
        await supabase
          .from('callups')
          .update({ number, position })
          .eq('match_id', matchId)
          .eq('player_id', playerId),
      ),
    onMutate: async (changed: Callup) => {
      await queryClient.cancelQueries({ queryKey: callupsKey })
      const previous = queryClient.getQueryData<Callup[]>(callupsKey) ?? []
      queryClient.setQueryData(
        callupsKey,
        previous.map((callup) => (callup.playerId === changed.playerId ? changed : callup)),
      )
      return previous
    },
    onError: (_error, _input, previous) => queryClient.setQueryData(callupsKey, previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: callupsKey }),
  })
}
