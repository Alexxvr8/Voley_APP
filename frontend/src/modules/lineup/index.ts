// Registration of the lineup module: the "Rotación" tab of a match (set plan; match mode in phase 2).
// It has no menu entry: it is reached from the match tabs. Works offline.
import type { ModuleDefinition } from '@/core/modules/types'
import { SetPlanPage } from './SetPlanPage'

export const lineupModule: ModuleDefinition = {
  id: 'lineup',
  name: 'Rotación',
  routes: [{ path: 'partidos/:matchId/rotacion', component: SetPlanPage }],
  minRole: 'assistant',
  offline: true,
}
