// Tests for the result editor drafts.
import { describe, expect, it } from 'vitest'
import { isValidPoints, toDraft, toSets } from './resultDraft'

describe('result drafts', () => {
  it('starts with one empty row', () => {
    expect(toDraft([])).toEqual([{ us: '', them: '' }])
  })
  it('keeps only complete sets', () => {
    expect(
      toSets([
        { us: '25', them: '20' },
        { us: '12', them: '' },
      ]),
    ).toEqual([{ us: 25, them: 20 }])
  })
  it('round-trips saved sets', () => {
    const sets = [{ us: 25, them: 23 }]
    expect(toSets(toDraft(sets))).toEqual(sets)
  })
  it('accepts only 0 to 99', () => {
    expect(isValidPoints('')).toBe(true)
    expect(isValidPoints('25')).toBe(true)
    expect(isValidPoints('100')).toBe(false)
    expect(isValidPoints('-1')).toBe(false)
  })
})
