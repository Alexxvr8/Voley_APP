// Registration of the team settings module: name, join codes, pending players, members and
// training schedule. Coach only.
import type { ModuleDefinition } from '@/core/modules/types'
import { TeamSettingsPage } from './TeamSettingsPage'

export const teamsModule: ModuleDefinition = {
  id: 'teams',
  name: 'Ajustes del equipo',
  routes: [{ path: 'ajustes', component: TeamSettingsPage }],
  menu: { label: 'Ajustes', path: 'ajustes' },
  minRole: 'coach',
  offline: false,
}
