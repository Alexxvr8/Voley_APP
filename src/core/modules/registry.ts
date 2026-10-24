import type { ModuleDefinition } from './types'

/**
 * All feature modules known to the app.
 * To add a module: create `src/modules/<module>/index.ts` exporting a `ModuleDefinition` and append it here.
 */
export const modules: ModuleDefinition[] = []
