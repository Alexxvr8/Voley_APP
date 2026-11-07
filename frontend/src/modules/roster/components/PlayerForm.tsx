// Roster entry form, used to add a player and to edit one: name, number, year and every position
// they can play (a main one plus any others).
import { useState, type FormEvent } from 'react'
import { POSITION_LABELS, POSITIONS } from '@/shared/domain/labels'
import type { Player, Position } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from '@/shared/ui/form'
import type { PlayerInput } from '../api'

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
  const [number, setNumber] = useState(initial?.number?.toString() ?? '')
  const [birthYear, setBirthYear] = useState(initial?.birthYear?.toString() ?? '')
  const [mainPosition, setMainPosition] = useState<Position>(initial?.mainPosition ?? 'outside')
  const [otherPositions, setOtherPositions] = useState<Position[]>(initial?.otherPositions ?? [])

  function toggleOther(position: Position) {
    setOtherPositions((current) =>
      current.includes(position) ? current.filter((p) => p !== position) : [...current, position],
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      number: number ? Number(number) : null,
      birthYear: birthYear ? Number(birthYear) : null,
      mainPosition,
      otherPositions: otherPositions.filter((p) => p !== mainPosition),
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
        <label className={`col-span-2 ${LABEL_CLASS}`}>
          <span className={LABEL_TEXT_CLASS}>Posición principal</span>
          <select
            className={INPUT_CLASS}
            value={mainPosition}
            onChange={(e) => setMainPosition(e.target.value as Position)}
          >
            {POSITIONS.map((position) => (
              <option key={position} value={position}>
                {POSITION_LABELS[position]}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="col-span-2">
          <legend className={LABEL_TEXT_CLASS}>También puede jugar de</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {POSITIONS.filter((p) => p !== mainPosition).map((position) => (
              <label
                key={position}
                className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  checked={otherPositions.includes(position)}
                  onChange={() => toggleOther(position)}
                  className="accent-blue-800"
                />
                {POSITION_LABELS[position]}
              </label>
            ))}
          </div>
        </fieldset>
        {failed && <p className={`col-span-2 ${ERROR_CLASS}`}>No se ha podido guardar.</p>}
        <button type="button" onClick={onCancel} className={SECONDARY_BUTTON_CLASS}>
          Cancelar
        </button>
        <button type="submit" disabled={busy} className={PRIMARY_BUTTON_CLASS}>
          {busy ? 'Guardando…' : submitLabel}
        </button>
      </form>
    </Card>
  )
}
