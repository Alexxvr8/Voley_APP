// Registration of the results module: played matches and the unofficial league table.
import type { ModuleDefinition } from '@/core/modules/types'
import { ResultsPage } from './ResultsPage'

export const resultsModule: ModuleDefinition = {
  id: 'results',
  name: 'Resultados',
  routes: [{ path: 'resultados', component: ResultsPage }],
  menu: { label: 'Resultados', path: 'resultados' },
  minRole: 'player',
  offline: false,
}
