// Server calls of the matches module: matches, trainings for the calendar, availability and call-ups.
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/core/query/queryClient'
import { supabase } from '@/core/supabase/client'
import {
  toMatch,
  toPlayer,
  toTeamVenue,
  toTrainingAnswer,
  toTrainingCancellation,
  toTrainingSlot,
  type MatchRow,
  type PlayerRow,
  type TrainingAnswerRow,
  type TrainingSlotRow,
} from '@/shared/domain/rows'
import { toCallup, type CallupRow } from '@/shared/domain/callups'
import type {
  AvailabilityEntry,
  AvailabilityStatus,
  Callup,
  FinalScore,
  SetScore,
  SetsFormat,
  TrainingAnswer,
} from '@/shared/domain/types'

const keys = {
  matches: (teamId: string) => ['matches', teamId],
  players: (teamId: string) => ['players', teamId],
  slots: (teamId: string) => ['training-slots', teamId],
  cancellations: (teamId: string) => ['training-cancellations', teamId],
  trainingAnswers: (teamId: string) => ['training-answers', teamId],
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

/** Every training attendance answer of the team from today on (they are few: one per player and date). */
export function useTrainingAnswers(teamId: string, fromDate: string) {
  return useQuery({
    queryKey: [...keys.trainingAnswers(teamId), fromDate],
    queryFn: async () =>
      (
        check(
          await supabase
            .from('training_attendance')
            .select('slot_id, date, player_id, status, training_slots!inner(team_id)')
            .eq('training_slots.team_id', teamId)
            .gte('date', fromDate),
        ) as TrainingAnswerRow[]
      ).map(toTrainingAnswer),
  })
}

/** Saves whether a player comes to a training. The buttons update at once and go back on error. */
export function useSetTrainingAnswer(teamId: string) {
  const prefix = keys.trainingAnswers(teamId)
  return useMutation({
    mutationFn: async (answer: TrainingAnswer) =>
      check(
        await supabase.from('training_attendance').upsert({
          slot_id: answer.slotId,
          date: answer.date,
          player_id: answer.playerId,
          status: answer.status,
          updated_at: new Date().toISOString(),
        }),
      ),
    onMutate: async (answer) => {
      await queryClient.cancelQueries({ queryKey: prefix })
      const previous = queryClient.getQueriesData<TrainingAnswer[]>({ queryKey: prefix })
      queryClient.setQueriesData<TrainingAnswer[]>({ queryKey: prefix }, (current) => [
        ...(current ?? []).filter(
          (a) =>
            !(
              a.slotId === answer.slotId &&
              a.date === answer.date &&
              a.playerId === answer.playerId
            ),
        ),
        answer,
      ])
      return previous
    },
    onError: (_error, _answer, previous) => {
      previous?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: prefix }),
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
      comment,
    }: {
      matchId: string
      playerId: string
      status: AvailabilityStatus
      /** Optional note ("depende de un examen"); left as it was when not given. */
      comment?: string
    }) =>
      check(
        await supabase.from('availability').upsert({
          match_id: matchId,
          player_id: playerId,
          status,
          ...(comment === undefined ? {} : { comment }),
          updated_at: new Date().toISOString(),
        }),
      ),
    onMutate: async ({ matchId, playerId, status, comment }) => {
      const matchKey = keys.availability(matchId)
      const playerKey = keys.myAvailability(playerId)
      await queryClient.cancelQueries({ queryKey: matchKey })
      await queryClient.cancelQueries({ queryKey: playerKey })
      const previous = {
        match: queryClient.getQueryData<Record<string, AvailabilityEntry>>(matchKey),
        player: queryClient.getQueryData<Record<string, AvailabilityStatus>>(playerKey),
      }
      const before = previous.match?.[playerId]
      queryClient.setQueryData(matchKey, {
        ...previous.match,
        [playerId]: { status, comment: comment ?? before?.comment },
      })
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

/** Called-up players of a match, with their per-match number and positions. */
export function useCallups(matchId: string) {
  return useQuery({
    queryKey: keys.callups(matchId),
    queryFn: async () =>
      (
        check(
          await supabase
            .from('callups')
            .select('player_id, number, positions')
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
        calledUp ? [...others, { playerId, number: null, positions: null }] : others,
      )
      return previous
    },
    onError: (_error, _input, previous) => queryClient.setQueryData(callupsKey, previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: callupsKey }),
  })
}

/** Editable fields of a match, shared by the create and edit forms. */
export interface MatchInput {
  opponent: string
  date: string
  /** Minutes of warm-up before the match (multiples of 15), null if not set. */
  warmupMinutes: number | null
  matchTime: string
  venue: string
  mapsUrl: string
  homeAway: 'home' | 'away'
  notes: string
  setsFormat: SetsFormat
}

function toMatchColumns(match: MatchInput) {
  return {
    opponent: match.opponent,
    date: match.date,
    warmup_minutes: match.warmupMinutes,
    match_time: match.matchTime || null,
    venue: match.venue,
    maps_url: match.mapsUrl,
    home_away: match.homeAway,
    notes: match.notes,
    sets_format: match.setsFormat,
  }
}

export function useCreateMatch(teamId: string) {
  return useMutation({
    mutationFn: async (match: MatchInput) =>
      (
        check(
          await supabase
            .from('matches')
            .insert({ team_id: teamId, ...toMatchColumns(match) })
            .select('id')
            .single(),
        ) as { id: string }
      ).id,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.matches(teamId) }),
  })
}

export function useUpdateMatch(teamId: string, matchId: string) {
  return useMutation({
    mutationFn: async (match: MatchInput) =>
      check(await supabase.from('matches').update(toMatchColumns(match)).eq('id', matchId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.matches(teamId) }),
  })
}

/** Deletes the match with its availability answers, call-ups and set plans. */
export function useDeleteMatch(teamId: string) {
  return useMutation({
    mutationFn: async (matchId: string) =>
      check(await supabase.from('matches').delete().eq('id', matchId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.matches(teamId) }),
  })
}

/** A match result as saved: the format plus either the points of each set or only the final score. */
export interface MatchResultInput {
  format: SetsFormat
  sets: SetScore[]
  finalScore: FinalScore | null
}

/** Saves the result. With a result the match is "played"; without one, back to "scheduled". */
export function useSetMatchResult(teamId: string, matchId: string) {
  return useMutation({
    mutationFn: async ({ format, sets, finalScore }: MatchResultInput) =>
      check(
        await supabase
          .from('matches')
          .update({
            sets_format: format,
            sets_result: sets,
            final_score: finalScore,
            status: sets.length || finalScore ? 'played' : 'scheduled',
          })
          .eq('id', matchId),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.matches(teamId) }),
  })
}

/** Change to one call-up: only the fields being edited, so quick successive edits never undo each other. */
export interface CallupChange {
  playerId: string
  changes: Partial<Pick<Callup, 'number' | 'positions'>>
}

/** Number and positions a called-up player uses in this match only (null = the roster values). */
export function useSetCallupDetails(matchId: string) {
  const callupsKey = keys.callups(matchId)
  return useMutation({
    mutationFn: async ({ playerId, changes }: CallupChange) =>
      check(
        await supabase
          .from('callups')
          .update(changes)
          .eq('match_id', matchId)
          .eq('player_id', playerId),
      ),
    onMutate: async ({ playerId, changes }: CallupChange) => {
      await queryClient.cancelQueries({ queryKey: callupsKey })
      const previous = queryClient.getQueryData<Callup[]>(callupsKey) ?? []
      queryClient.setQueryData(
        callupsKey,
        previous.map((callup) =>
          callup.playerId === playerId ? { ...callup, ...changes } : callup,
        ),
      )
      return previous
    },
    onError: (_error, _input, previous) => queryClient.setQueryData(callupsKey, previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: callupsKey }),
  })
}

/** The team's usual venues, offered in the match form. */
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
        ) as { id: string; name: string; maps_url: string }[]
      ).map(toTeamVenue),
  })
}

/**
 * Names of the team's usual opponents, suggested in the match form. The cache stores the same rows
 * as Ajustes (`id, name`, shared key) and this hook only picks the names.
 */
export function useTeamOpponents(teamId: string) {
  return useQuery({
    queryKey: ['team-opponents', teamId],
    queryFn: async () =>
      check(
        await supabase
          .from('team_opponents')
          .select('id, name')
          .eq('team_id', teamId)
          .order('name'),
      ) as { id: string; name: string }[],
    select: (rows) => rows.map((row) => row.name),
  })
}

/** Adds a name typed in the match form to the team's opponents list. */
export function useSaveOpponent(teamId: string) {
  return useMutation({
    mutationFn: async (name: string) =>
      check(await supabase.from('team_opponents').insert({ team_id: teamId, name })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-opponents', teamId] }),
  })
}
