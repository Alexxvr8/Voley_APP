// Tests for what the embedded map shows from each kind of Google Maps link.
import { describe, expect, it } from 'vitest'
import { isMapsLink, isValidMapsUrl, mapsQuery } from './maps'

describe('mapsQuery', () => {
  it('takes the coordinates of a full link', () => {
    expect(
      mapsQuery('https://www.google.com/maps/place/Pavell%C3%B3/@41.4036,2.1744,17z', 'X'),
    ).toBe('41.4036,2.1744')
  })
  it('takes the q parameter', () => {
    expect(mapsQuery('https://maps.google.com/?q=Pavello+Nord', 'X')).toBe('Pavello Nord')
  })
  it('falls back to the venue name for short links and empty links', () => {
    expect(mapsQuery('https://maps.app.goo.gl/abc123', 'Pabellón Sur')).toBe('Pabellón Sur')
    expect(mapsQuery('', 'Pabellón Sur')).toBe('Pabellón Sur')
  })
})

describe('isMapsLink / isValidMapsUrl', () => {
  it('accepts Google Maps links and rejects others', () => {
    expect(isMapsLink('https://maps.app.goo.gl/abc')).toBe(true)
    expect(isMapsLink('https://www.google.es/maps/place/x')).toBe(true)
    expect(isMapsLink('https://example.com/maps')).toBe(false)
  })
  it('treats an empty link as valid (it is optional)', () => {
    expect(isValidMapsUrl('  ')).toBe(true)
    expect(isValidMapsUrl('hola')).toBe(false)
  })
})
