// Tests of the VAPID key conversion used to subscribe.
import { describe, expect, it } from 'vitest'
import { keyBytes } from './push'

describe('keyBytes', () => {
  it('decodes base64url without padding', () => {
    expect([...keyBytes('BAEC_-8')]).toEqual([4, 1, 2, 255, 239])
  })
})
