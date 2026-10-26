import { lineupModule } from '@/modules/lineup'
import { matchesModule } from '@/modules/matches'
import { rosterModule } from '@/modules/roster'
import type { ModuleDefinition } from './types'

/**
 * All feature modules known to the app, in menu order.
 * To add a module: create `src/modules/<module>/index.ts` exporting a `ModuleDefinition` and append it here.
 */
export const modules: ModuleDefinition[] = [matchesModule, rosterModule, lineupModule]
