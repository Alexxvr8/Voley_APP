// Base colour of the team, shown next to its name in the menu. Tapping a colour saves it.
import { TEAM_COLORS } from '@/shared/domain/teamColors'
import type { Team } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { useSetTeamColor } from '../api'

export function TeamColorCard({ team }: { team: Team }) {
  const setColor = useSetTeamColor(team.id)

  return (
    <Card className="space-y-3">
      <p className="font-semibold">Color del equipo</p>
      <div className="grid grid-cols-10 gap-2" role="radiogroup" aria-label="Color del equipo">
        {TEAM_COLORS.map((color) => {
          const selected = color.value === team.color
          return (
            <button
              key={color.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={color.label}
              title={color.label}
              disabled={setColor.isPending}
              onClick={() => setColor.mutate(color.value)}
              style={{ backgroundColor: color.value }}
              className={`aspect-square w-full rounded-full ${selected ? 'ring-4 ring-offset-2 ring-slate-400' : 'hover:scale-110'}`}
            />
          )
        })}
      </div>
    </Card>
  )
}
