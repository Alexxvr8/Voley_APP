// Accepting a pending player: link their account to a roster entry without account, or create a new one.
import { useState, type FormEvent } from 'react'
import { POSITION_LABELS, POSITIONS } from '@/shared/domain/labels'
import type { Player, Position } from '@/shared/domain/types'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from '@/shared/ui/form'
import { playerName, shirtNumber } from '@/shared/utils/format'
import { useAcceptMember } from '../api'
import type { Member } from '../members'

interface AcceptMemberDialogProps {
  teamId: string
  member: Member
  /** Roster entries not linked to any account yet. */
  freePlayers: Player[]
  onClose: () => void
}

const NEW_PLAYER = 'new'

export function AcceptMemberDialog({
  teamId,
  member,
  freePlayers,
  onClose,
}: AcceptMemberDialogProps) {
  const accept = useAcceptMember(teamId)
  const [choice, setChoice] = useState<string>(freePlayers.length ? '' : NEW_PLAYER)
  const [firstName, setFirstName] = useState(member.displayName)
  const [lastName, setLastName] = useState('')
  const [number, setNumber] = useState('')
  const [position, setPosition] = useState<Position>('outside')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const input =
      choice === NEW_PLAYER
        ? {
            member: member.userId,
            newPlayer: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              number: number ? Number(number) : null,
              mainPosition: position,
            },
          }
        : { member: member.userId, playerId: choice }
    accept.mutate(input, { onSuccess: onClose })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Aceptar a ${member.displayName}`}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-xl"
      >
        <div>
          <p className="text-lg font-bold text-slate-900">Aceptar a {member.displayName}</p>
          <p className="text-sm text-slate-500">Elige su ficha en la plantilla o crea una nueva.</p>
        </div>

        <label className={LABEL_CLASS}>
          <span className={LABEL_TEXT_CLASS}>Ficha</span>
          <select
            className={INPUT_CLASS}
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            required
          >
            <option value="" disabled>
              Elige una ficha…
            </option>
            {freePlayers.map((player) => (
              <option key={player.id} value={player.id}>
                {shirtNumber(player)}. {playerName(player)}
              </option>
            ))}
            <option value={NEW_PLAYER}>+ Crear ficha nueva</option>
          </select>
        </label>

        {choice === NEW_PLAYER && (
          <div className="grid grid-cols-2 gap-3">
            <label className={`col-span-2 ${LABEL_CLASS}`}>
              <span className={LABEL_TEXT_CLASS}>Nombre</span>
              <input
                className={INPUT_CLASS}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </label>
            <label className={`col-span-2 ${LABEL_CLASS}`}>
              <span className={LABEL_TEXT_CLASS}>Apellidos</span>
              <input
                className={INPUT_CLASS}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>
            <label className={LABEL_CLASS}>
              <span className={LABEL_TEXT_CLASS}>Dorsal</span>
              <input
                className={INPUT_CLASS}
                type="number"
                min={0}
                max={99}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </label>
            <label className={LABEL_CLASS}>
              <span className={LABEL_TEXT_CLASS}>Posición</span>
              <select
                className={INPUT_CLASS}
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
              >
                {POSITIONS.map((value) => (
                  <option key={value} value={value}>
                    {POSITION_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {accept.isError && (
          <p className={ERROR_CLASS}>No se ha podido aceptar. ¿Esa ficha ya tiene cuenta?</p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON_CLASS}>
            Cancelar
          </button>
          <button type="submit" disabled={accept.isPending} className={PRIMARY_BUTTON_CLASS}>
            {accept.isPending ? 'Guardando…' : 'Aceptar'}
          </button>
        </div>
      </form>
    </div>
  )
}
