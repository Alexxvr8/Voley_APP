// Google Maps links: the link to open and the address shown in the embedded map (no API key needed).

/** Link to open in Google Maps: the one pasted by the coach, or a search for the venue name. */
export function mapsOpenUrl(mapsUrl: string, venue: string): string {
  if (mapsUrl) return mapsUrl
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`
}

/**
 * What the embedded map should show. Full Google Maps links carry coordinates (`@41.38,2.17`),
 * a `q`/`query` parameter or a place name; short `maps.app.goo.gl` links do not, so the venue
 * name is used instead.
 */
export function mapsQuery(mapsUrl: string, venue: string): string {
  const coordinates = mapsUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (coordinates) return `${coordinates[1]},${coordinates[2]}`
  try {
    const url = new URL(mapsUrl)
    const query = url.searchParams.get('q') ?? url.searchParams.get('query')
    if (query) return query
    const place = url.pathname.match(/\/place\/([^/]+)/)
    if (place) return decodeURIComponent(place[1].replace(/\+/g, ' '))
  } catch {
    // Not a URL (or empty): fall back to the venue name.
  }
  return venue
}

/** `src` of the embedded map iframe. */
export function mapsEmbedUrl(mapsUrl: string, venue: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(mapsQuery(mapsUrl, venue))}&z=15&output=embed`
}

/** True if the text looks like a Google Maps link (full or short). */
export function isMapsLink(text: string): boolean {
  return /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/.test(
    text.trim(),
  )
}

/** True when the pasted link is empty (it is optional) or looks like Google Maps. */
export function isValidMapsUrl(url: string): boolean {
  return url.trim() === '' || isMapsLink(url)
}
