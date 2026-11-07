// Contract between the core and the feature modules.
import type { ComponentType } from 'react'
import type { TeamRole } from '@/shared/domain/types'

export type { TeamRole }

/** A screen contributed by a module. */
export interface ModuleRoute {
  /** Path relative to the team, e.g. `partidos/:matchId` → `/equipos/<team>/partidos/<id>`. */
  path: string
  component: ComponentType
}

/** Entry shown in the app navigation menu. */
export interface ModuleMenuEntry {
  /** User-facing label, in Spanish. */
  label: string
  /** Path relative to the team, like `ModuleRoute.path`. */
  path: string
}

/**
 * Contract every feature module exports from `src/modules/<module>/index.ts`.
 * The core reads these definitions, plus the team's `enabled_modules`, to decide what to show.
 */
export interface ModuleDefinition {
  /** Stable identifier, matches the values stored in `teams.enabled_modules`. */
  id: string
  /** User-facing name, in Spanish. */
  name: string
  routes: ModuleRoute[]
  menu?: ModuleMenuEntry
  /** Lowest role allowed to access the module. */
  minRole: TeamRole
  /** Whether the module must work without network (see spec "Funciones online y offline"). */
  offline: boolean
}
