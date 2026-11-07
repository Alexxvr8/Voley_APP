// Registration of the lineup module: the "Rotación" tab of a match (set plan) and the match mode.
// It has no menu entry: it is reached from the match tabs. Works offline.
import type { ModuleDefinition } from '@/core/modules/types'
import { prepareLineupOffline } from './api'
import { MatchModePage } from './MatchModePage'
import { SetPlanPage } from './SetPlanPage'

export const lineupModule: ModuleDefinition = {
  id: 'lineup',
  name: 'Rotación',
  routes: [
    { path: 'partidos/:matchId/rotacion', component: SetPlanPage },
    { path: 'partidos/:matchId/partido', component: MatchModePage },
  ],
  minRole: 'assistant',
  offline: true,
  prepareOffline: prepareLineupOffline,
}
