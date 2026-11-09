// Joins two roster entries of the same person (for example a player created by hand who was later
// accepted with a new entry). Everything moves to the entry that stays; the other one is deleted.
import { useState } from 'react'
import type { Player } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  SECONDARY_BUTTON_CLASS,
} from '@/shared/ui/form'
import { byShirtNumber, fullName, shirtNumber } from '@/shared/utils/format'
import { useMergePlayers } from '../api'

interface MergePlayersCardProps {
  teamId: string
  players: Player[]
  /** Roster entries linked to an account (two of them cannot be merged). */
  linked: Set<string>
}

function optionLabel(player: Player, linked: Set<string>): string {
  return `${shirtNumber(player)}. ${fullName(player)}${linked.has(player.id) ? ' (con cuenta)' : ''}`
}

export function MergePlayersCard({ teamId, players, linked }: MergePlayersCardProps) {
  const merge = useMergePlayers(teamId)
  const [keepId, setKeepId] = useState('')
  const [duplicateId, setDuplicateId] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  if (players.length < 2) return null
  const sorted = [...players].sort(byShirtNumber)
  const keep = players.find((p) => p.id === keepId)
  const duplicate = players.find((p) => p.id === duplicateId)
  const bothLinked = keep && duplicate && linked.has(keep.id) && linked.has(duplicate.id)

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-semibold">Juntar fichas repetidas</p>
        <p className="text-sm text-slate-500">
          Si un jugador tiene dos fichas (por ejemplo, la que creaste a mano y otra nueva al
          aceptarlo), júntalas: sus convocatorias, respuestas, entrenamientos, rotaciones y su
          cuenta pasan a la ficha que se queda.
        </p>
      </div>

      <label className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Ficha que se queda</span>
        <select className={INPUT_CLASS} value={keepId} onChange={(e) => setKeepId(e.target.value)}>
          <option value="">Elige…</option>
          {sorted.map((player) => (
            <option key={player.id} value={player.id}>
              {optionLabel(player, linked)}
            </option>
          ))}
        </select>
      </label>
      <label className={LABEL_CLASS}>
        <span className={LABEL_TEXT_CLASS}>Ficha repetida (se borra)</span>
        <select
          className={INPUT_CLASS}
          value={duplicateId}
          onChange={(e) => setDuplicateId(e.target.value)}
        >
          <option value="">Elige…</option>
          {sorted
            .filter((player) => player.id !== keepId)
            .map((player) => (
              <option key={player.id} value={player.id}>
                {optionLabel(player, linked)}
              </option>
            ))}
        </select>
      </label>

      {bothLinked && (
        <p className={ERROR_CLASS}>
          Las dos fichas tienen cuenta. Quita del equipo la cuenta que sobra antes de juntarlas.
        </p>
      )}
      {merge.isError && <p className={ERROR_CLASS}>No se han podido juntar las fichas.</p>}
      {done && (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Hecho: todo está ahora en la ficha de {done}.
        </p>
      )}

      <button
        type="button"
        disabled={!keep || !duplicate || Boolean(bothLinked) || merge.isPending}
        onClick={() => setConfirming(true)}
        className={`w-full ${SECONDARY_BUTTON_CLASS}`}
      >
        Juntar fichas
      </button>

      {confirming && keep && duplicate && (
        <ConfirmDialog
          title={`¿Juntar ${fullName(duplicate)} en ${fullName(keep)}?`}
          confirmLabel="Juntar"
          busy={merge.isPending}
          onCancel={() => setConfirming(false)}
          onConfirm={() =>
            merge.mutate(
              { keep: keep.id, duplicate: duplicate.id },
              {
                onSuccess: () => {
                  setDone(fullName(keep))
                  setKeepId('')
                  setDuplicateId('')
                },
                onSettled: () => setConfirming(false),
              },
            )
          }
        >
          Todo lo de {fullName(duplicate)} pasa a {fullName(keep)} y la ficha de{' '}
          {fullName(duplicate)} se borra. No se puede deshacer.
        </ConfirmDialog>
      )}
    </Card>
  )
}
