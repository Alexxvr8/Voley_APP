// Tests of the Gestión list order.
import { describe, expect, it } from 'vitest'
import type { Player, Position } from '@/shared/domain/types'
import { orderCallupList } from './callupOrder'

function player(id: string, number: number, mainPosition: Position): Player {
  return {
    id,
    firstName: id,
    lastName: '',
    nickname: '',
    birthYear: null,
    number,
    mainPosition,
    otherPositions: [],
    competes: true,
    active: true,
    membership: 'member',
    visitWeekdays: [],
    visitDate: null,
  }
}

describe('orderCallupList', () => {
  const players = [
    player('libero', 1, 'libero'),
    player('middle', 2, 'middle'),
    player('setter', 9, 'setter'),
    player('benched', 3, 'outside'),
    player('outside', 7, 'outside'),
  ]

  it('puts called-up players first, by position, and the rest by number', () => {
    const callups = ['libero', 'middle', 'setter', 'outside'].map((playerId) => ({
      playerId,
      number: null,
      positions: null,
    }))
    expect(orderCallupList(players, callups).map((entry) => entry.player.id)).toEqual([
      'setter',
      'outside',
      'middle',
      'libero',
      'benched',
    ])
  })

  it('uses the position chosen for this match', () => {
    const callups = [
      { playerId: 'libero', number: null, positions: ['setter' as Position] },
      { playerId: 'setter', number: 10, positions: null },
    ]
    expect(
      orderCallupList(players, callups)
        .map((entry) => entry.player.id)
        .slice(0, 2),
    ).toEqual(['libero', 'setter'])
  })
})
