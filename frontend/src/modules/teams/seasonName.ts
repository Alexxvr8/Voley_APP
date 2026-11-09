// Suggests the name of the next season from the current one ("2026-27" → "2027-28").

/**
 * Next season's name when the current one looks like a year range ("2026-27", "2026/2027",
 * "Temporada 2026-2027") or a single year ("2026"); otherwise an empty string to type it.
 */
export function nextSeasonName(current: string): string {
  const range = current.match(/^(.*?)(\d{4})([-/])(\d{4}|\d{2})(.*)$/)
  if (range) {
    const [, before, start, separator, end, after] = range
    const next = Number(start) + 1
    const nextEnd = end.length === 2 ? String((next + 1) % 100).padStart(2, '0') : String(next + 1)
    return `${before}${next}${separator}${nextEnd}${after}`
  }
  const year = current.match(/^(.*?)(\d{4})(.*)$/)
  if (year) return `${year[1]}${Number(year[2]) + 1}${year[3]}`
  return ''
}
