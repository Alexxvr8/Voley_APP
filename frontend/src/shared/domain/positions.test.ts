// Tests for the position checklist conversions.
import { describe, expect, it } from 'vitest'
import { fromPositionList, toPositionList, togglePosition } from './positions'

describe('position list', () => {
  it('puts the main position first', () => {
    expect(toPositionList('middle', ['setter', 'middle'])).toEqual(['middle', 'setter'])
  })
  it('takes the first checked as main', () => {
    expect(fromPositionList(['libero', 'outside'])).toEqual({
      mainPosition: 'libero',
      otherPositions: ['outside'],
    })
    expect(fromPositionList([])).toBeNull()
  })
  it('promotes the next one when the main is unchecked', () => {
    const list = togglePosition(['setter', 'opposite'], 'setter')
    expect(fromPositionList(list)?.mainPosition).toBe('opposite')
    expect(togglePosition(list, 'setter')).toEqual(['opposite', 'setter'])
  })
})
