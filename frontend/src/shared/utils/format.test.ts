// Tests for durations and the warm-up text.
import { describe, expect, it } from 'vitest'
import { formatDuration, formatWarmup, timeMinus } from './format'

describe('formatDuration', () => {
  it('shows minutes and hours in Spanish', () => {
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(60)).toBe('1 h')
    expect(formatDuration(75)).toBe('1 h 15 min')
  })
})

describe('formatWarmup', () => {
  it('adds the start time when the match has one', () => {
    expect(formatWarmup(45, '18:00')).toBe('45 min (desde 17:15)')
    expect(formatWarmup(60, '')).toBe('1 h')
    expect(formatWarmup(null, '18:00')).toBe('')
  })
  it('wraps around midnight', () => {
    expect(timeMinus('00:30', 45)).toBe('23:45')
  })
})
