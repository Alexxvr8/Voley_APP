// Which sections a team shows in the menu, from the module registry, the team's modules and the user's role.
import { useMatch } from 'react-router'
import { modules } from '@/core/modules/registry'
import type { ModuleMenuEntry } from '@/core/modules/types'
import { useMyTeams, useTeam } from '@/core/teams/api'
import { hasRole } from '@/core/teams/currentTeam'
import type { MyTeam } from '@/shared/domain/types'

/** The team in the URL (`/equipos/:teamId/…`), if the user belongs to it and is not pending. */
export function useOpenTeam(): MyTeam | undefined {
  const match = useMatch('/equipos/:teamId/*')
  const myTeams = useMyTeams()
  const team = myTeams.data?.find((t) => t.id === match?.params.teamId)
  return team && !team.pending ? team : undefined
}

/** Menu sections of a team the user can open. Empty until the team settings are loaded. */
export function useTeamMenu(team: MyTeam | undefined): ModuleMenuEntry[] {
  const settings = useTeam(team?.id ?? '', team !== undefined)
  if (!team || !settings.data) return []
  const enabled = settings.data.enabledModules
  return modules
    .filter((module) => enabled.includes(module.id) && hasRole(team.role, module.minRole))
    .flatMap((module) => (module.menu ? [module.menu] : []))
}
