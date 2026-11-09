// State of the match mode and how it turns a set plan into who is on court right now (no React here).
// It is kept on the device only, so the coach can close the app and continue where they were.
import { hasOpposite, SUB_STEP_COUNT, type SetPlan } from './setPlan'
import { advanceLineup, type Zone } from './systems'

/**
 * Progress inside one set: rotations made and, per planned change (by index), how many of its steps
 * are done (0 = not yet; 1 = done, or the player is in to serve / the double switch is on; 2 = back).
 */
export interface SetProgress {
  steps: number
  subSteps: Partial<Record<number, number>>
}

export interface MatchModeState {
  currentSet: number
  sets: Partial<Record<number, SetProgress>>
}

export const INITIAL_MATCH_MODE: MatchModeState = { currentSet: 1, sets: {} }

export const NO_PROGRESS: SetProgress = { steps: 0, subSteps: {} }

/** Progress saved on the device, also by older versions (which kept `subsDone: number[]`). */
export function readProgress(saved: unknown): SetProgress {
  if (!saved || typeof saved !== 'object') return NO_PROGRESS
  const raw = saved as { steps?: number; subSteps?: SetProgress['subSteps']; subsDone?: number[] }
  const subSteps = raw.subSteps ?? Object.fromEntries((raw.subsDone ?? []).map((i) => [i, 1]))
  return { steps: raw.steps ?? 0, subSteps }
}

/** Whether a planned change is in effect now: done once and not undone ("Vuelve" not pressed). */
function isActive(progress: SetProgress, index: number): boolean {
  return progress.subSteps[index] === 1
}

/** Whether anything happened in the set yet (then system and start rotation are fixed). */
export function hasStarted(progress: SetProgress): boolean {
  return progress.steps > 0 || Object.values(progress.subSteps).some((done) => (done ?? 0) > 0)
}

/** Who is in each zone now: the planned lineup, rotated, with the changes in effect applied. */
export function liveLineup(plan: SetPlan, progress: SetProgress): Partial<Record<Zone, string>> {
  const lineup = advanceLineup(plan.rotation, progress.steps)
  plan.subs.forEach((sub, index) => {
    if (!isActive(progress, index)) return
    for (const swap of sub.swaps) {
      const zone = (Object.keys(lineup).map(Number) as Zone[]).find((z) => lineup[z] === swap.outId)
      if (zone) lineup[zone] = swap.inId
    }
  })
  return lineup
}

/**
 * Rotations to use for the roles and the R shown: the real ones, plus three for each double switch
 * in effect (setter and opposite trade places, e.g. R4 → R1). Players do not move.
 */
export function roleSteps(plan: SetPlan, progress: SetProgress): number {
  // Only a system with an opposite has a setter ↔ opposite switch (a plan may keep one from a 5-1).
  if (!hasOpposite(plan.system)) return progress.steps
  const doubles = plan.subs.filter(
    (sub, index) => sub.kind === 'double' && isActive(progress, index),
  )
  return progress.steps + 3 * doubles.length
}

/** Does the next step of a planned change ("Hacer cambio", "Vuelve"…). */
export function advanceSub(progress: SetProgress, plan: SetPlan, index: number): SetProgress {
  const sub = plan.subs[index]
  if (!sub) return progress
  const done = Math.min((progress.subSteps[index] ?? 0) + 1, SUB_STEP_COUNT[sub.kind])
  return { ...progress, subSteps: { ...progress.subSteps, [index]: done } }
}

/** Undoes the last step of a planned change. */
export function undoSub(progress: SetProgress, index: number): SetProgress {
  const done = Math.max((progress.subSteps[index] ?? 0) - 1, 0)
  return { ...progress, subSteps: { ...progress.subSteps, [index]: done } }
}
