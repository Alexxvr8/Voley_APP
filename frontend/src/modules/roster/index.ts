// Registration of the roster module. Everyone in the team sees it; only staff edit it.
import type { ModuleDefinition } from '@/core/modules/types'
import { RosterPage } from './RosterPage'

export const rosterModule: ModuleDefinition = {
  id: 'roster',
  name: 'Plantilla',
  routes: [{ path: 'plantilla', component: RosterPage }],
  menu: { label: 'Plantilla', path: 'plantilla' },
  minRole: 'player',
  offline: false,
}
