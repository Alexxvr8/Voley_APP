// Registration of the matches module: calendar (matches and trainings), match info, availability,
// and the Gestión tab (call-ups with per-match number and position).
import type { ModuleDefinition } from '@/core/modules/types'
import { CalendarPage } from './CalendarPage'
import { ManagementPage } from './ManagementPage'
import { MatchDetailPage } from './MatchDetailPage'
import { NewMatchPage } from './NewMatchPage'

export const matchesModule: ModuleDefinition = {
  id: 'matches',
  name: 'Partidos',
  routes: [
    { path: 'partidos', component: CalendarPage },
    { path: 'partidos/nuevo', component: NewMatchPage },
    { path: 'partidos/:matchId', component: MatchDetailPage },
    { path: 'partidos/:matchId/gestion', component: ManagementPage },
  ],
  menu: { label: 'Partidos', path: 'partidos' },
  minRole: 'player',
  offline: false,
}
