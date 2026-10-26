import type { ModuleDefinition } from '@/core/modules/types'
import { SetPlanPage } from './SetPlanPage'

export const lineupModule: ModuleDefinition = {
  id: 'lineup',
  name: 'Plan de partido',
  routes: [
    { path: '/plan', component: SetPlanPage },
    { path: '/partidos/:matchId/plan', component: SetPlanPage },
  ],
  menu: { label: 'Plan', path: '/plan' },
  minRole: 'assistant',
  offline: true,
}
