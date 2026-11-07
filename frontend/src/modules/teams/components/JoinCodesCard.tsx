// Join codes per role: show, create or renew, and switch them on and off.
import { Card } from '@/shared/ui/Card'
import { SECONDARY_BUTTON_CLASS } from '@/shared/ui/form'
import { useJoinCodes, useRegenerateCode, useSetCodeActive, type CodeRole } from '../api'

const CODE_ROLES: { role: CodeRole; label: string; hint: string }[] = [
  { role: 'player', label: 'Jugadores', hint: 'Entran como pendientes hasta que los aceptes.' },
  {
    role: 'assistant',
    label: 'Segundo entrenador',
    hint: 'Entra directamente con permisos de staff.',
  },
]

export function JoinCodesCard({ teamId }: { teamId: string }) {
  const codes = useJoinCodes(teamId)
  const regenerate = useRegenerateCode(teamId)
  const setActive = useSetCodeActive(teamId)

  return (
    <Card className="space-y-4">
      <div>
        <p className="font-semibold">Códigos para entrar</p>
        <p className="text-sm text-slate-500">
          Pásalos por el grupo del equipo. Se pueden renovar o desactivar.
        </p>
      </div>

      {CODE_ROLES.map(({ role, label, hint }) => {
        const code = codes.data?.find((entry) => entry.role === role)
        return (
          <div key={role} className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              {code && (
                <span
                  className={`text-xs font-semibold ${code.active ? 'text-emerald-700' : 'text-slate-400'}`}
                >
                  {code.active ? 'Activo' : 'Desactivado'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{hint}</p>
            {code && (
              <p
                className={`font-mono text-2xl font-bold tracking-widest select-all ${code.active ? 'text-blue-900' : 'text-slate-300 line-through'}`}
              >
                {code.code}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => regenerate.mutate(role)}
                disabled={regenerate.isPending}
                className={SECONDARY_BUTTON_CLASS}
              >
                {code ? 'Renovar código' : 'Crear código'}
              </button>
              {code && (
                <button
                  type="button"
                  onClick={() => setActive.mutate({ role, active: !code.active })}
                  disabled={setActive.isPending}
                  className={SECONDARY_BUTTON_CLASS}
                >
                  {code.active ? 'Desactivar' : 'Activar'}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </Card>
  )
}
