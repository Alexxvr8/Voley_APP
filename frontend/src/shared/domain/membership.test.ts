// Tests of who is expected at matches and trainings by membership.
import { describe, expect, it } from 'vitest'
import { isTeamMember, membershipComplete, playsMatchOn, trainsOn } from './membership'
import type { Player } from './types'

function player(overrides: Partial<Player>): Player {
  return {
    id: 'p',
    firstName: 'Ana',
    lastName: '',
    birthYear: null,
    number: null,
    mainPosition: 'outside',
    otherPositions: [],
    competes: true,
    active: true,
    membership: 'member',
    visitWeekdays: [],
    visitDate: null,
    ...overrides,
  }
}

// 2026-11-09 is a Monday, 2026-11-11 a Wednesday.
const MONDAY = '2026-11-09'
const WEDNESDAY = '2026-11-11'

describe('playsMatchOn', () => {
  it('lets members and regulars play any match', () => {
    expect(playsMatchOn(player({}), WEDNESDAY)).toBe(true)
    expect(playsMatchOn(player({ membership: 'regular', visitWeekdays: [1] }), WEDNESDAY)).toBe(
      true,
    )
  })

  it('limits one-offs to their day and leaves out non-competing or inactive players', () => {
    const oneOff = player({ membership: 'one_off', visitDate: MONDAY })
    expect(playsMatchOn(oneOff, MONDAY)).toBe(true)
    expect(playsMatchOn(oneOff, WEDNESDAY)).toBe(false)
    expect(playsMatchOn(player({ competes: false }), MONDAY)).toBe(false)
    expect(playsMatchOn(player({ active: false }), MONDAY)).toBe(false)
  })
})

describe('trainsOn', () => {
  it('asks regulars only on their weekdays and one-offs only on their day', () => {
    const regular = player({ membership: 'regular', visitWeekdays: [1] })
    expect(trainsOn(regular, MONDAY)).toBe(true)
    expect(trainsOn(regular, WEDNESDAY)).toBe(false)
    expect(trainsOn(player({ membership: 'one_off', visitDate: WEDNESDAY }), WEDNESDAY)).toBe(true)
    expect(trainsOn(player({}), WEDNESDAY)).toBe(true)
  })
})

describe('isTeamMember', () => {
  it('is only true for active members', () => {
    expect(isTeamMember(player({}))).toBe(true)
    expect(isTeamMember(player({ membership: 'regular', visitWeekdays: [1] }))).toBe(false)
    expect(isTeamMember(player({ active: false }))).toBe(false)
  })
})

describe('membershipComplete', () => {
  it('needs some day for regulars and the date for one-offs', () => {
    expect(membershipComplete({ membership: 'member', visitWeekdays: [], visitDate: null })).toBe(
      true,
    )
    expect(membershipComplete({ membership: 'regular', visitWeekdays: [], visitDate: null })).toBe(
      false,
    )
    expect(
      membershipComplete({ membership: 'one_off', visitWeekdays: [], visitDate: MONDAY }),
    ).toBe(true)
  })
})
