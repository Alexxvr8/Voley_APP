// Single list of feature modules. The core builds routes and menu from it.
import { lineupModule } from '@/modules/lineup'
import { matchesModule } from '@/modules/matches'
import { resultsModule } from '@/modules/results'
import { rosterModule } from '@/modules/roster'
import { teamsModule } from '@/modules/teams'
import type { ModuleDefinition } from './types'

/**
 * All feature modules known to the app, in menu order.
 * To add a module: create `src/modules/<module>/index.ts` exporting a `ModuleDefinition` and append it here.
 */
export const modules: ModuleDefinition[] = [
  matchesModule,
  resultsModule,
  rosterModule,
  lineupModule,
  teamsModule,
]
