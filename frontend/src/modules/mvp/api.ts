// Server calls of the MVP module: matches, players and call-ups (shared cache keys with the other
// modules), the caller's vote and the coach's RPCs (open, close, tally, resolve a tie, ranking).
import { useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/core/query/queryClient'
import { supabase } from '@/core/supabase/client'
import { toCallup, type CallupRow } from '@/shared/domain/callups'
import { toMatch, toPlayer, type MatchRow, type PlayerRow } from '@/shared/domain/rows'
import type { Team } from '@/shared/domain/types'

const keys = {
  matches: (teamId: string) => ['matches', teamId],
  players: (teamId: string) => ['players', teamId],
  callups: (matchId: string) => ['callups', matchId],
  myCallups: (playerId: string) => ['my-callups', playerId],
  team: (teamId: string) => ['team', teamId],
  myVote: (matchId: string) => ['mvp-my-vote', matchId],
  results: (matchId: string) => ['mvp-results', matchId],
}

/** Throws the Supabase error, so TanStack Query marks the call as failed. */
function check<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw error
  return data
}

/** Same query as the calendar (shared cache). */
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

/** Same query as the roster (shared cache). */
export function usePlayers(teamId: string) {
  return useQuery({
    queryKey: keys.players(teamId),
    queryFn: async () =>
      (check(await supabase.from('players').select('*').eq('team_id', teamId)) as PlayerRow[]).map(
        toPlayer,
      ),
  })
}

/** Called-up players of a match (same query as the Gestión tab). */
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

/** Ids of the matches the current player is called up for (same query as the calendar). */
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

/**
 * Closes the votes whose 48 h are over (the server does it lazily) and reloads the matches.
 * Screens call it when they see an open vote past its deadline.
 */
async function settleVotes(teamId: string, matchIds: string[]): Promise<void> {
  await Promise.all(matchIds.map((id) => supabase.rpc('settle_mvp', { match: id })))
  await queryClient.invalidateQueries({ queryKey: keys.matches(teamId) })
}

/** Roster ids the caller voted for in a match (empty if they have not voted). */
export function useMyVote(matchId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.myVote(matchId),
    enabled,
    queryFn: async () => check(await supabase.rpc('my_mvp_vote', { match: matchId })) as string[],
  })
}

export function useCastVote(teamId: string, matchId: string) {
  return useMutation({
    mutationFn: async (ids: string[]) =>
      check(await supabase.rpc('cast_mvp_vote', { match: matchId, ids })),
    onSuccess: (_data, ids) => {
      queryClient.setQueryData(keys.myVote(matchId), ids)
      queryClient.invalidateQueries({ queryKey: keys.results(matchId) })
    },
    // The vote may have closed in the meantime: reload so the screen shows its real state.
    onError: () => queryClient.invalidateQueries({ queryKey: keys.matches(teamId) }),
  })
}

export interface MvpTally {
  /** Votes per player, most voted first. */
  votes: { playerId: string; votes: number }[]
  /** How many have voted. */
  voters: number
  /** How many can vote: coaches plus called-up players with an account. */
  eligible: number
}

/** Count of the vote (coach only; never who voted whom). */
export function useMvpTally(matchId: string, enabled: boolean) {
  return useQuery({
    queryKey: keys.results(matchId),
    enabled,
    queryFn: async () => {
      const data = check(await supabase.rpc('mvp_results', { match: matchId })) as {
        tally: { player_id: string; votes: number }[]
        voters: number
        eligible: number
      }
      return {
        votes: data.tally.map((row) => ({ playerId: row.player_id, votes: row.votes })),
        voters: data.voters,
        eligible: data.eligible,
      } as MvpTally
    },
  })
}

/** A coach RPC on one match's vote; reloads the matches and the tally afterwards. */
function useCoachRpc<T>(teamId: string, matchId: string, call: (value: T) => PromiseLike<unknown>) {
  return useMutation({
    mutationFn: async (value: T) => {
      const { error } = (await call(value)) as { error: unknown }
      if (error) throw error
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.matches(teamId) })
      queryClient.invalidateQueries({ queryKey: keys.results(matchId) })
    },
  })
}

/** Opens the vote of a played match that never had one (48 h). */
export function useOpenVote(teamId: string, matchId: string) {
  return useCoachRpc<void>(teamId, matchId, () => supabase.rpc('open_mvp_vote', { match: matchId }))
}

/** Closes the vote before its 48 h. */
export function useCloseVote(teamId: string, matchId: string) {
  return useCoachRpc<void>(teamId, matchId, () =>
    supabase.rpc('close_mvp_vote', { match: matchId }),
  )
}

/** Breaks a tie with one or more of the tied players (several = co-MVP). */
export function useResolveTie(teamId: string, matchId: string) {
  return useCoachRpc<string[]>(teamId, matchId, (ids) =>
    supabase.rpc('resolve_mvp_tie', { match: matchId, ids }),
  )
}

/** Shows or hides the season ranking to players. */
export function useSetRankingVisible(teamId: string) {
  const teamKey = keys.team(teamId)
  return useMutation({
    mutationFn: async (visible: boolean) =>
      check(await supabase.from('teams').update({ mvp_ranking_visible: visible }).eq('id', teamId)),
    onMutate: async (visible: boolean) => {
      await queryClient.cancelQueries({ queryKey: teamKey })
      const previous = queryClient.getQueryData<Team>(teamKey)
      if (previous) queryClient.setQueryData(teamKey, { ...previous, mvpRankingVisible: visible })
      return { previous }
    },
    onError: (_error, _visible, context) => queryClient.setQueryData(teamKey, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: teamKey }),
  })
}

/**
 * Closes, once per screen, the open votes in `matches` whose 48 h are over. The server closes them
 * lazily, so whoever opens a screen after the deadline triggers it.
 */
export function useSettleExpiredVotes(teamId: string, expiredMatchIds: string[]) {
  const settled = useRef(new Set<string>())
  const expiredKey = expiredMatchIds.join(',')

  useEffect(() => {
    const ids = expiredKey.split(',').filter((id) => id && !settled.current.has(id))
    if (ids.length === 0) return
    ids.forEach((id) => settled.current.add(id))
    void settleVotes(teamId, ids)
  }, [teamId, expiredKey])
}
