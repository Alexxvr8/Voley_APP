// Gives screens the list of feature modules without importing the registry (which imports the
// modules themselves, so a module importing it would be circular). App.tsx provides the registry.
import { createContext, useContext } from 'react'
import type { ModuleDefinition } from './types'

export const ModuleCatalogContext = createContext<ModuleDefinition[]>([])

/** All feature modules of the app, in menu order. */
export function useModuleCatalog(): ModuleDefinition[] {
  return useContext(ModuleCatalogContext)
}
