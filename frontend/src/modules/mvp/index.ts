// Registration of the MVP module: secret vote for the best player of each played match and the
// season ranking. Optional: teams turn it on in Ajustes.
import type { ModuleDefinition } from '@/core/modules/types'
import { MvpMatchPage } from './MvpMatchPage'
import { MvpPage } from './MvpPage'

export const mvpModule: ModuleDefinition = {
  id: 'mvp',
  name: 'MVP del partido',
  routes: [
    { path: 'mvp', component: MvpPage },
    { path: 'mvp/:matchId', component: MvpMatchPage },
  ],
  menu: { label: 'MVP', path: 'mvp' },
  minRole: 'player',
  offline: false,
}
