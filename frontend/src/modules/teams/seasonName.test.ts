// Tests of the next season name suggestion.
import { describe, expect, it } from 'vitest'
import { nextSeasonName } from './seasonName'

describe('nextSeasonName', () => {
  it('moves year ranges one year on, keeping their format', () => {
    expect(nextSeasonName('2026-27')).toBe('2027-28')
    expect(nextSeasonName('2026/2027')).toBe('2027/2028')
    expect(nextSeasonName('Temporada 2099-00')).toBe('Temporada 2100-01')
  })

  it('moves a single year and gives up on anything else', () => {
    expect(nextSeasonName('Liga 2026')).toBe('Liga 2027')
    expect(nextSeasonName('Primera')).toBe('')
  })
})
