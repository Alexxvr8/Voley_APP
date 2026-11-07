// Form to add a roster entry. The player can link their account to it later, when the coach accepts them.
import { useState, type FormEvent } from 'react'
import { POSITION_LABELS, POSITIONS } from '@/shared/domain/labels'
import type { Position } from '@/shared/domain/types'
import { Card } from '@/shared/ui/Card'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from '@/shared/ui/form'
import { useAddPlayer } from '../api'

export function AddPlayerForm({ teamId, onDone }: { teamId: string; onDone: () => void }) {
  const addPlayer = useAddPlayer(teamId)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [number, setNumber] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [mainPosition, setMainPosition] = useState<Position>('outside')
  const [otherPositions, setOtherPositions] = useState<Position[]>([])

  function toggleOther(position: Position) {
    setOtherPositions((current) =>
      current.includes(position) ? current.filter((p) => p !== position) : [...current, position],
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    addPlayer.mutate(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        number: number ? Number(number) : null,
        birthYear: birthYear ? Number(birthYear) : null,
        mainPosition,
        otherPositions: otherPositions.filter((p) => p !== mainPosition),
      },
      { onSuccess: onDone },
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <p className="col-span-2 font-semibold">Nuevo jugador</p>
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
        {addPlayer.isError && (
          <p className={`col-span-2 ${ERROR_CLASS}`}>No se ha podido guardar.</p>
        )}
        <button type="button" onClick={onDone} className={SECONDARY_BUTTON_CLASS}>
          Cancelar
        </button>
        <button type="submit" disabled={addPlayer.isPending} className={PRIMARY_BUTTON_CLASS}>
          {addPlayer.isPending ? 'Guardando…' : 'Añadir'}
        </button>
      </form>
    </Card>
  )
}
