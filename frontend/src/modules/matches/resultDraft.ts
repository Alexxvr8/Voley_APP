// Converts between saved set points and the text drafts of the result editor (no React here).
import type { SetScore } from '@/shared/domain/types'

/** Text inputs of one set; a set is only kept when both scores are filled in. */
export interface DraftSet {
  us: string
  them: string
}

/** Draft rows for the saved sets, or one empty row when there are none. */
export function toDraft(sets: SetScore[]): DraftSet[] {
  return sets.length
    ? sets.map((set) => ({ us: String(set.us), them: String(set.them) }))
    : [{ us: '', them: '' }]
}

/** Sets with both scores filled in, as numbers. */
export function toSets(draft: DraftSet[]): SetScore[] {
  return draft
    .filter((set) => set.us !== '' && set.them !== '')
    .map((set) => ({ us: Number(set.us), them: Number(set.them) }))
}

/** True if the text is empty or a score between 0 and 99. */
export function isValidPoints(value: string): boolean {
  return value === '' || (/^\d{1,2}$/.test(value) && Number(value) <= 99)
}
