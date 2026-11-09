// Season picker shown above per-season lists (results, MVP). Hidden while the team has one season.
import type { Season } from '@/shared/domain/types'
import { seasonLabel } from '@/shared/utils/format'

interface SeasonSelectProps {
  seasons: Season[]
  value: string
  onChange: (seasonId: string) => void
  /** The team's current season, labelled "(actual)". */
  currentSeasonId: string
}

export function SeasonSelect({ seasons, value, onChange, currentSeasonId }: SeasonSelectProps) {
  if (seasons.length < 2) return null
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Temporada"
      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
    >
      {seasons.map((season) => (
        <option key={season.id} value={season.id}>
          {seasonLabel(season)}
          {season.id === currentSeasonId ? ' (actual)' : ''}
        </option>
      ))}
    </select>
  )
}
