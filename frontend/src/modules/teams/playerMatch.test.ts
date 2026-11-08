// Tests for guessing the roster entry of a player who joins.
import { describe, expect, it } from 'vitest'
import type { Player } from '@/shared/domain/types'
import type { Member } from './members'
import { nameWords, suggestPlayer } from './playerMatch'

const player = (id: string, firstName: string, lastName = ''): Player =>
  ({ id, firstName, lastName }) as Player
const member = (displayName: string, username = 'user'): Member => ({
  userId: 'u',
  username,
  displayName,
  role: 'player',
  playerId: null,
})

describe('suggestPlayer', () => {
  it('ignores accents and case', () => {
    expect(nameWords('José  ÁNGEL')).toEqual(['jose', 'angel'])
  })
  it('matches by first name, also inside the username', () => {
    const roster = [player('1', 'Juan'), player('2', 'Lucía')]
    expect(suggestPlayer(member('', 'juan23'), roster)?.id).toBe('1')
    expect(suggestPlayer(member('lucia'), roster)?.id).toBe('2')
  })
  it('prefers first and last name', () => {
    const roster = [player('1', 'Juan', 'Pérez'), player('2', 'Juan', 'García')]
    expect(suggestPlayer(member('Juan García'), roster)?.id).toBe('2')
  })
  it('suggests nothing when it is a tie or no match', () => {
    const roster = [player('1', 'Juan', 'Pérez'), player('2', 'Juan', 'García')]
    expect(suggestPlayer(member('Juan'), roster)).toBeNull()
    expect(suggestPlayer(member('Marta'), roster)).toBeNull()
  })
})
