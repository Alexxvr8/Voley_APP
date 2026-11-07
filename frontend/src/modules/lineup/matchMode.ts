// State of the match mode and how it turns a set plan into who is on court right now (no React here).
// It is kept on the device only, so the coach can close the app and continue where they were.
import type { SetPlan } from './setPlan'
import { advanceLineup, type Zone } from './systems'

/** Progress inside one set: rotations made and planned substitutions already done (by index). */
export interface SetProgress {
  steps: number
  subsDone: number[]
}

export interface MatchModeState {
  currentSet: number
  sets: Partial<Record<number, SetProgress>>
}

export const INITIAL_MATCH_MODE: MatchModeState = { currentSet: 1, sets: {} }

export const NO_PROGRESS: SetProgress = { steps: 0, subsDone: [] }

/** Who is in each zone now: the planned lineup, rotated, with the substitutions done applied. */
export function liveLineup(plan: SetPlan, progress: SetProgress): Partial<Record<Zone, string>> {
  const lineup = advanceLineup(plan.rotation, progress.steps)
  for (const index of progress.subsDone) {
    const sub = plan.subs[index]
    if (!sub) continue
    const zone = (Object.keys(lineup) as unknown as Zone[]).find((z) => lineup[z] === sub.outId)
    if (zone) lineup[zone] = sub.inId
  }
  return lineup
}

/** Marks a planned substitution as done, or undoes it. */
export function toggleSub(progress: SetProgress, index: number): SetProgress {
  const subsDone = progress.subsDone.includes(index)
    ? progress.subsDone.filter((i) => i !== index)
    : [...progress.subsDone, index]
  return { ...progress, subsDone }
}
