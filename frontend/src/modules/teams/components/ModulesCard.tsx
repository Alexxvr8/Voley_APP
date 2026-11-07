// Turns the team's sections (feature modules) on or off. The settings module itself is always on.
import { useModuleCatalog } from '@/core/modules/catalog'
import type { Team } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { useSetEnabledModules } from '../api'

/** Modules that cannot be switched off: without them the coach could not reach the settings. */
const ALWAYS_ON = ['teams']

export function ModulesCard({ team }: { team: Team }) {
  const catalog = useModuleCatalog().filter((module) => !ALWAYS_ON.includes(module.id))
  const setEnabled = useSetEnabledModules(team.id)

  function toggle(moduleId: string) {
    const enabled = team.enabledModules.includes(moduleId)
      ? team.enabledModules.filter((id) => id !== moduleId)
      : [...team.enabledModules, moduleId]
    setEnabled.mutate(enabled)
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-semibold">Secciones del equipo</p>
        <p className="text-sm text-slate-500">
          Desactiva lo que tu equipo no use. Se puede volver a activar.
        </p>
      </div>
      {catalog.map((module) => {
        const on = team.enabledModules.includes(module.id)
        return (
          <label
            key={module.id}
            className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3"
          >
            <span className="text-sm font-medium text-slate-800">{module.name}</span>
            <input
              type="checkbox"
              role="switch"
              checked={on}
              disabled={setEnabled.isPending}
              onChange={() => toggle(module.id)}
              className="size-5 accent-blue-800"
            />
          </label>
        )
      })}
    </Card>
  )
}
