// Server data of the lineup module: players, matches, call-ups and the saved set plans. Set plan
// changes go through the device's outbox (core/offline/outbox): saved locally at once and sent
// whenever there is network, also after closing the app.
import { useQuery } from '@tanstack/react-query'
import { notify } from '@/core/offline/notices'
import { offlineDb } from '@/core/offline/db'
import { enqueue, registerOutboxHandler, useOutboxEntries } from '@/core/offline/outbox'
import { queryClient } from '@/core/query/queryClient'
import { supabase } from '@/core/supabase/client'
import { toCallup, type CallupRow } from '@/shared/domain/callups'
import { toMatch, toPlayer, type MatchRow, type PlayerRow } from '@/shared/domain/rows'
import { todayIso } from '@/shared/utils/format'
import type { SetPlan } from './setPlan'
import { toSaveArgs, toStoredSetPlan, type SetPlanRow, type StoredSetPlans } from './setPlanRows'

/** Throws the Supabase error, so TanStack Query marks the call as failed. */
function check<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw error
  return data
}

const playersQuery = (teamId: string) => ({
  queryKey: ['players', teamId],
  queryFn: async () =>
    (check(await supabase.from('players').select('*').eq('team_id', teamId)) as PlayerRow[]).map(
      toPlayer,
    ),
})

const matchesQuery = (teamId: string) => ({
  queryKey: ['matches', teamId],
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

const callupsQuery = (matchId: string) => ({
  queryKey: ['callups', matchId],
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

const setPlansKey = (matchId: string) => ['set-plans', matchId]

const setPlansQuery = (matchId: string) => ({
  queryKey: setPlansKey(matchId),
  queryFn: async () => {
    const rows = check(
      await supabase
        .from('set_plans')
        .select(
          'set_number, system, start_rotation, rotation, libero_id, second_libero_id, planned_subs, updated_at',
        )
        .eq('match_id', matchId),
    ) as SetPlanRow[]
    return Object.fromEntries(
      rows.map((row) => [row.set_number, toStoredSetPlan(row)]),
    ) as StoredSetPlans
  },
})

export function usePlayers(teamId: string) {
  return useQuery(playersQuery(teamId))
}

export function useMatches(teamId: string) {
  return useQuery(matchesQuery(teamId))
}

/** Called-up players with the number and positions they use in this match. */
export function useCallups(matchId: string) {
  return useQuery(callupsQuery(matchId))
}

// --- Saving -----------------------------------------------------------------------------------

const OUTBOX_KIND = 'set-plan'
const outboxPrefix = (matchId: string) => `set-plan:${matchId}:`

interface SavePlanPayload {
  matchId: string
  setNumber: number
  plan: SetPlan
  /** Server version the edit started from, to detect someone else's changes. */
  baseUpdatedAt: string | null
}

/** What `save_set_plan()` answers. */
interface SaveResult {
  updated_at: string
  overwritten: boolean
  overwritten_by: string | null
}

// Sends one queued set plan. Registered at load time so the queue left from a previous session is sent too.
registerOutboxHandler(OUTBOX_KIND, async (payload) => {
  const { matchId, setNumber, plan, baseUpdatedAt } = payload as SavePlanPayload
  const { data, error } = await supabase.rpc(
    'save_set_plan',
    toSaveArgs(matchId, setNumber, plan, baseUpdatedAt),
  )
  if (error) throw error
  const result = data as SaveResult
  if (result.overwritten) {
    notify(
      `${result.overwritten_by ?? 'Otra persona'} había cambiado el set ${setNumber} mientras tanto. Se ha guardado tu versión.`,
    )
  }
  void queryClient.invalidateQueries({ queryKey: setPlansKey(matchId) })
})

/**
 * Saved plans of every set of a match, with the changes still waiting in the outbox on top, so the
 * screen always shows the latest version made on this device.
 */
export function useSetPlans(matchId: string) {
  const server = useQuery(setPlansQuery(matchId))
  const queued = useOutboxEntries(outboxPrefix(matchId))
  if (!server.data || !queued) return { ...server, data: undefined, isPending: true as const }
  const plans: StoredSetPlans = { ...server.data }
  for (const entry of queued) {
    const { setNumber, plan } = entry.payload as SavePlanPayload
    plans[setNumber] = { plan, updatedAt: server.data[setNumber]?.updatedAt ?? null }
  }
  return { ...server, data: plans }
}

/**
 * Saves a set's new plan: written to the device at once (shown immediately, survives closing the app)
 * and sent to the server now or as soon as there is network.
 */
export async function savePlan(matchId: string, setNumber: number, plan: SetPlan): Promise<void> {
  const key = `${outboxPrefix(matchId)}${setNumber}`
  // Keep the version the first offline edit started from, so a conflict is still detected.
  const queued = (await offlineDb.outbox.get(key))?.payload as SavePlanPayload | undefined
  const server = queryClient.getQueryData<StoredSetPlans>(setPlansKey(matchId))
  const baseUpdatedAt = queued ? queued.baseUpdatedAt : (server?.[setNumber]?.updatedAt ?? null)
  const payload: SavePlanPayload = { matchId, setNumber, plan, baseUpdatedAt }
  await enqueue(key, OUTBOX_KIND, payload)
}

// --- Offline download -------------------------------------------------------------------------

/** How many upcoming matches are kept on the device per team. */
const OFFLINE_MATCHES = 5

/**
 * Downloads the roster and, for the next matches, their call-ups and set plans. Returns the
 * matches now available offline.
 */
export async function prepareLineupOffline(teamId: string): Promise<string[]> {
  const fresh = { staleTime: 0 }
  const [matches] = await Promise.all([
    queryClient.fetchQuery({ ...matchesQuery(teamId), ...fresh }),
    queryClient.fetchQuery({ ...playersQuery(teamId), ...fresh }),
  ])
  const upcoming = matches.filter((match) => match.date >= todayIso()).slice(0, OFFLINE_MATCHES)
  await Promise.all(
    upcoming.flatMap((match) => [
      queryClient.fetchQuery({ ...callupsQuery(match.id), ...fresh }),
      // Changes still in the outbox are shown on top of this, so it is safe to refresh.
      queryClient.fetchQuery({ ...setPlansQuery(match.id), ...fresh }),
    ]),
  )
  return upcoming.map((match) => match.id)
}
