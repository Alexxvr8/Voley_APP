// Downloads to the device what each offline module needs (spec "Descarga automática"): on opening the
// app with network, and on demand with "Preparar para sin conexión". Remembers which matches are ready.
import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { ModuleDefinition } from '@/core/modules/types'
import { queryClient } from '@/core/query/queryClient'
import { teamQuery, useMyTeams } from '@/core/teams/api'
import { hasRole } from '@/core/teams/currentTeam'
import type { MyTeam } from '@/shared/domain/types'
import { offlineDb, type OfflineMatch } from './db'
import { useOnline } from './online'

/** Modules of the app, handed over by App.tsx (importing the registry here would be circular). */
let offlineModules: ModuleDefinition[] = []

export function setOfflineModules(modules: ModuleDefinition[]): void {
  offlineModules = modules
}

/** Do not download again more often than this when the app is reopened. */
const AUTO_PREPARE_INTERVAL = 10 * 60 * 1000
let lastAutoPrepare = 0

/** Runs every offline module the user can open in this team and records the matches it prepared. */
export async function prepareTeamOffline(team: MyTeam): Promise<void> {
  if (team.pending) return
  const settings = await queryClient.fetchQuery({ ...teamQuery(team.id), staleTime: 0 })
  const preparers = offlineModules.filter(
    (module) =>
      module.prepareOffline &&
      settings.enabledModules.includes(module.id) &&
      hasRole(team.role, module.minRole),
  )
  const matchIds = (
    await Promise.all(preparers.map((module) => module.prepareOffline!(team.id)))
  ).flat()
  const syncedAt = Date.now()
  await offlineDb.offlineMatches.bulkPut(
    matchIds.map((matchId) => ({ matchId, teamId: team.id, syncedAt })),
  )
}

/** Prepares every team of the user, at most once every few minutes, whenever there is network. */
export function useAutoPrepareOffline(): void {
  const online = useOnline()
  const myTeams = useMyTeams()

  useEffect(() => {
    if (!online || !myTeams.data || Date.now() - lastAutoPrepare < AUTO_PREPARE_INTERVAL) return
    lastAutoPrepare = Date.now()
    // A failed download just means some data is not on the device yet; it is retried later.
    Promise.all(myTeams.data.map(prepareTeamOffline)).catch(() => {
      lastAutoPrepare = 0
    })
  }, [online, myTeams.data])
}

/** Whether a match is on the device, and since when. Undefined while unknown or not downloaded. */
export function useOfflineMatch(matchId: string): OfflineMatch | undefined {
  return useLiveQuery(() => offlineDb.offlineMatches.get(matchId), [matchId])
}
