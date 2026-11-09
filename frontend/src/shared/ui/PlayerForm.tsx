// Roster entry form, used to add a player (Ajustes, Plantilla) and to edit one (Plantilla): name,
// nickname (shown instead of the full name), number, year, every position they can play (the first one checked is the main one) and whether
// they are part of the team or come on some days / one day.
import { useState, type FormEvent } from 'react'
import { fromPositionList, toPositionList } from '@/shared/domain/positions'
import type { Player, PlayerInput, Position } from '@/shared/domain/types'
import { Card } from './Card'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from './form'
import { membershipComplete, type MembershipValue } from '@/shared/domain/membership'
import { MembershipFields } from './MembershipFields'
import { PositionChecklist } from './PositionChecklist'

interface PlayerFormProps {
  title: string
  /** Player being edited; empty form when adding a new one. */
  initial?: Player
  submitLabel: string
  busy: boolean
  failed: boolean
  onSubmit: (player: PlayerInput) => void
  onCancel: () => void
}

export function PlayerForm({
  title,
  initial,
  submitLabel,
  busy,
  failed,
  onSubmit,
  onCancel,
}: PlayerFormProps) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [lastName, setLastName] = useState(initial?.lastName ?? '')
  const [nickname, setNickname] = useState(initial?.nickname ?? '')
  const [number, setNumber] = useState(initial?.number?.toString() ?? '')
  const [birthYear, setBirthYear] = useState(initial?.birthYear?.toString() ?? '')
  const [positions, setPositions] = useState<Position[]>(
    initial ? toPositionList(initial.mainPosition, initial.otherPositions) : [],
  )
  const [membership, setMembership] = useState<MembershipValue>({
    membership: initial?.membership ?? 'member',
    visitWeekdays: initial?.visitWeekdays ?? [],
    visitDate: initial?.visitDate ?? null,
  })
  const chosen = fromPositionList(positions)
  const ready = Boolean(chosen) && membershipComplete(membership)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!chosen || !ready) return
    onSubmit({
      ...membership,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname: nickname.trim(),
      number: number ? Number(number) : null,
      birthYear: birthYear ? Number(birthYear) : null,
      ...chosen,
    })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <p className="col-span-2 font-semibold">{title}</p>
        <label className={LABEL_CLASS}>
          <span className={LABEL_TEXT_CLASS}>Nombre</span>
          <input
            className={INPUT_CLASS}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </label>
        <label className={LABEL_CLASS}>
          <span className={LABEL_TEXT_CLASS}>Apellidos</span>
          <input
            className={INPUT_CLASS}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>
        <label className={`col-span-2 ${LABEL_CLASS}`}>
          <span className={LABEL_TEXT_CLASS}>Apodo (opcional)</span>
          <input
            className={INPUT_CLASS}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="Cómo la llamáis: Solis, Rodri… Sale en vez del nombre completo"
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
          <span className={LABEL_TEXT_CLASS}>Año de nacimiento</span>
          <input
            className={INPUT_CLASS}
            type="number"
            min={1950}
            max={2030}
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
          />
        </label>
        <PositionChecklist value={positions} onChange={setPositions} className="col-span-2" />
        <MembershipFields value={membership} onChange={setMembership} className="col-span-2" />
        {failed && <p className={`col-span-2 ${ERROR_CLASS}`}>No se ha podido guardar.</p>}
        <button type="button" onClick={onCancel} className={SECONDARY_BUTTON_CLASS}>
          Cancelar
        </button>
        <button type="submit" disabled={busy || !ready} className={PRIMARY_BUTTON_CLASS}>
          {busy ? 'Guardando…' : submitLabel}
        </button>
      </form>
    </Card>
  )
}
