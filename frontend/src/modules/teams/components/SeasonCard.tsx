// Current season and "Empezar temporada nueva": name the new season and tick who stays. Who is
// left unticked becomes a leaver ("baja"): out of the roster, keeping their history.
import { useState } from 'react'
import type { Player, Team } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from '@/shared/ui/form'
import { byShirtNumber, playerName, shirtNumber } from '@/shared/utils/format'
import { useStartSeason } from '../api'
import { nextSeasonName } from '../seasonName'

interface SeasonCardProps {
  team: Team
  /** Roster entries still in the team (leavers excluded). */
  activePlayers: Player[]
}

export function SeasonCard({ team, activePlayers }: SeasonCardProps) {
  const start = useStartSeason(team.id)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [leaving, setLeaving] = useState<string[]>([])
  const [confirming, setConfirming] = useState(false)
  const roster = [...activePlayers].sort(byShirtNumber)

  function open() {
    setName(nextSeasonName(team.season))
    setLeaving([])
    setEditing(true)
  }

  function toggleStays(playerId: string) {
    setLeaving((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId],
    )
  }

  function confirm() {
    start.mutate(
      { name: name.trim(), leaving },
      {
        onSuccess: () => {
          setConfirming(false)
          setEditing(false)
        },
        onError: () => setConfirming(false),
      },
    )
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-semibold">Temporada</p>
        <p className="text-sm text-slate-500">
          Actual: <strong className="text-slate-800">{team.season || 'sin nombre'}</strong>.
          Resultados, tabla y ranking MVP van por temporada; las anteriores se consultan con el
          selector.
        </p>
      </div>

      {!editing && (
        <button type="button" onClick={open} className={`w-full ${SECONDARY_BUTTON_CLASS}`}>
          Empezar temporada nueva
        </button>
      )}

      {editing && (
        <div className="space-y-3 border-t border-slate-100 pt-3">
          <label className={LABEL_CLASS}>
            <span className={LABEL_TEXT_CLASS}>Nombre de la nueva temporada</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Por ejemplo, 2027-28"
              className={INPUT_CLASS}
            />
          </label>

          <div className="space-y-2">
            <p className={LABEL_TEXT_CLASS}>¿Quién sigue? Desmarca a quien se va</p>
            {roster.length === 0 && <p className="text-sm text-slate-500">No hay jugadoras.</p>}
            <ul className="grid gap-1 sm:grid-cols-2">
              {roster.map((player) => {
                const stays = !leaving.includes(player.id)
                return (
                  <li key={player.id}>
                    <label
                      className={`flex items-center gap-3 rounded-lg px-2 py-2 ${stays ? '' : 'bg-rose-50 text-rose-800'}`}
                    >
                      <input
                        type="checkbox"
                        checked={stays}
                        onChange={() => toggleStays(player.id)}
                        className="size-5 accent-blue-800"
                      />
                      <span className="w-6 text-right text-sm text-slate-400">
                        {shirtNumber(player)}
                      </span>
                      <span className={`truncate text-sm ${stays ? '' : 'line-through'}`}>
                        {playerName(player)}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>

          {start.isError && (
            <p className={ERROR_CLASS}>No se ha podido empezar la temporada. Prueba otra vez.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={SECONDARY_BUTTON_CLASS}
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={name.trim() === ''}
              onClick={() => setConfirming(true)}
              className={PRIMARY_BUTTON_CLASS}
            >
              Empezar
            </button>
          </div>
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title={`¿Empezar la temporada ${name.trim()}?`}
          confirmLabel="Empezar"
          busy={start.isPending}
          onCancel={() => setConfirming(false)}
          onConfirm={confirm}
        >
          Los partidos nuevos irán a esta temporada y la tabla y el ranking MVP empiezan de cero.
          {leaving.length > 0 &&
            ` ${leaving.length === 1 ? 'Se va 1 jugadora' : `Se van ${leaving.length} jugadoras`}: sale de la plantilla y pierde el acceso, pero su historial se conserva.`}
        </ConfirmDialog>
      )}
    </Card>
  )
}
