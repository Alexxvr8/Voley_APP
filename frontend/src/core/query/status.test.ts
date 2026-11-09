// Tests of what a screen shows while its queries are not ready.
import { describe, expect, it } from 'vitest'
import { queriesProblem } from './status'

const ready = { data: [], isError: false, fetchStatus: 'idle' as const }

describe('queriesProblem', () => {
  it('shows saved data even when refreshing it failed', () => {
    expect(queriesProblem(ready, { data: [1], isError: true, fetchStatus: 'idle' })).toBeNull()
  })

  it('tells offline, error and loading apart for queries without data', () => {
    expect(queriesProblem(ready, { data: undefined, isError: false, fetchStatus: 'paused' })).toBe(
      'offline',
    )
    expect(queriesProblem({ data: undefined, isError: true, fetchStatus: 'idle' })).toBe('error')
    expect(queriesProblem({ data: undefined, isError: false, fetchStatus: 'fetching' })).toBe(
      'loading',
    )
  })
})
