import type { ModuleDefinition } from '@/core/modules/types'
import { MatchDetailPage } from './MatchDetailPage'
import { MatchesPage } from './MatchesPage'

export const matchesModule: ModuleDefinition = {
  id: 'matches',
  name: 'Próximos partidos',
  routes: [
    { path: '/partidos', component: MatchesPage },
    { path: '/partidos/:matchId', component: MatchDetailPage },
  ],
  menu: { label: 'Partidos', path: '/partidos' },
  minRole: 'player',
  offline: false,
}
