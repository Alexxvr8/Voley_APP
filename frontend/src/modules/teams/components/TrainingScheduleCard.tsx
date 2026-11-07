// Weekly training schedule: the days and hours the team trains (24 h, 15-minute steps) and where.
// They appear every week in the calendar.
import { useState, type FormEvent } from 'react'
import { WEEKDAY_LABELS } from '@/shared/domain/labels'
import { Card } from '@/shared/ui/Card'
import {
  ERROR_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  LABEL_TEXT_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '@/shared/ui/form'
import { TimeSelect } from '@/shared/ui/TimeSelect'
import { VenuePicker, type VenueValue } from '@/shared/ui/VenuePicker'
import { isValidMapsUrl } from '@/shared/utils/maps'
import { useAddTrainingSlot, useDeleteTrainingSlot, useTeamVenues, useTrainingSlots } from '../api'

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]

export function TrainingScheduleCard({ teamId }: { teamId: string }) {
  const slots = useTrainingSlots(teamId)
  const venues = useTeamVenues(teamId)
  const addSlot = useAddTrainingSlot(teamId)
  const deleteSlot = useDeleteTrainingSlot(teamId)
  const [weekday, setWeekday] = useState(1)
  const [startTime, setStartTime] = useState('18:00')
  const [endTime, setEndTime] = useState('19:30')
  const [place, setPlace] = useState<VenueValue>({ venue: '', mapsUrl: '' })
  const badLink = !isValidMapsUrl(place.mapsUrl)
  const badTimes = endTime <= startTime

  const sorted = [...(slots.data ?? [])].sort(
    (a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime),
  )

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (badLink || badTimes) return
    addSlot.mutate({
      weekday,
      startTime,
      endTime,
      venue: place.venue.trim(),
      mapsUrl: place.mapsUrl.trim(),
    })
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-semibold">Horario de entrenamientos</p>
        <p className="text-sm text-slate-500">
          Se repite cada semana en el calendario. Un día suelto se cancela desde el calendario.
        </p>
      </div>

      {sorted.length === 0 && <p className="text-sm text-slate-500">Aún no hay entrenamientos.</p>}
      {sorted.map((slot) => (
        <div
          key={slot.id}
          className="flex items-center gap-3 border-t border-slate-100 pt-3 text-sm"
        >
          <span className="w-24 font-semibold text-slate-800">{WEEKDAY_LABELS[slot.weekday]}</span>
          <span className="flex-1 text-slate-600">
            {slot.startTime}–{slot.endTime}
            {slot.venue && ` · ${slot.venue}`}
          </span>
          <button
            type="button"
            onClick={() => deleteSlot.mutate(slot.id)}
            className="text-xs font-medium text-rose-700 underline"
          >
            Quitar
          </button>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-slate-100 pt-3">
        <label className={LABEL_CLASS}>
          <span className={LABEL_TEXT_CLASS}>Día</span>
          <select
            className={INPUT_CLASS}
            value={weekday}
            onChange={(e) => setWeekday(Number(e.target.value))}
          >
            {WEEKDAYS.map((day) => (
              <option key={day} value={day}>
                {WEEKDAY_LABELS[day]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-4">
          <div className={LABEL_CLASS}>
            <span className={LABEL_TEXT_CLASS}>Desde</span>
            <TimeSelect
              value={startTime}
              onChange={setStartTime}
              step={15}
              label="Inicio del entrenamiento"
            />
          </div>
          <div className={LABEL_CLASS}>
            <span className={LABEL_TEXT_CLASS}>Hasta</span>
            <TimeSelect
              value={endTime}
              onChange={setEndTime}
              step={15}
              label="Fin del entrenamiento"
            />
          </div>
        </div>
        {venues.data && (
          <VenuePicker venues={venues.data} value={place} onChange={setPlace} label="Lugar" />
        )}
        {badTimes && (
          <p className={ERROR_CLASS}>La hora de fin tiene que ser después de la de inicio.</p>
        )}
        {addSlot.isError && <p className={ERROR_CLASS}>No se ha podido añadir el entrenamiento.</p>}
        <button
          type="submit"
          disabled={addSlot.isPending || badLink || badTimes}
          className={PRIMARY_BUTTON_CLASS}
        >
          Añadir entrenamiento
        </button>
      </form>
    </Card>
  )
}
