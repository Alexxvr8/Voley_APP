import type { ModuleDefinition } from '@/core/modules/types'
import { RosterPage } from './RosterPage'

export const rosterModule: ModuleDefinition = {
  id: 'roster',
  name: 'Plantilla',
  routes: [{ path: '/plantilla', component: RosterPage }],
  menu: { label: 'Plantilla', path: '/plantilla' },
  minRole: 'assistant',
  offline: false,
}
