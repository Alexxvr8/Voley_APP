// Tests for the order of the league table.
import { describe, expect, it } from 'vitest'
import { sortTable } from './leagueTable'

describe('sortTable', () => {
  it('orders by points, then wins, then name, and drops empty rows', () => {
    const rows = [
      { team: 'B', played: 4, won: 2, lost: 2, points: 6 },
      { team: '  ', played: 0, won: 0, lost: 0, points: 0 },
      { team: 'A', played: 4, won: 3, lost: 1, points: 6 },
      { team: 'C', played: 4, won: 4, lost: 0, points: 12 },
    ]
    expect(sortTable(rows).map((row) => row.team)).toEqual(['C', 'A', 'B'])
  })
})
