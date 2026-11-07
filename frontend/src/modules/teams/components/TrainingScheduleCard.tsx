// Weekly training schedule: the days and hours the team trains. They appear every week in the calendar.
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
import { isMapsLink } from '@/shared/utils/maps'
import { useAddTrainingSlot, useDeleteTrainingSlot, useTrainingSlots } from '../api'

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]

export function TrainingScheduleCard({ teamId }: { teamId: string }) {
  const slots = useTrainingSlots(teamId)
  const addSlot = useAddTrainingSlot(teamId)
  const deleteSlot = useDeleteTrainingSlot(teamId)
  const [weekday, setWeekday] = useState(1)
  const [startTime, setStartTime] = useState('18:00')
  const [endTime, setEndTime] = useState('19:30')
  const [venue, setVenue] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const badLink = mapsUrl.trim() !== '' && !isMapsLink(mapsUrl)

  const sorted = [...(slots.data ?? [])].sort(
    (a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime),
  )

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (badLink) return
    addSlot.mutate({ weekday, startTime, endTime, venue: venue.trim(), mapsUrl: mapsUrl.trim() })
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
            {slot.mapsUrl && ' · 📍'}
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

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-4"
      >
        <label className={`col-span-2 sm:col-span-1 ${LABEL_CLASS}`}>
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
        <label className={LABEL_CLASS}>
          <span className={LABEL_TEXT_CLASS}>Desde</span>
          <input
            className={INPUT_CLASS}
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </label>
        <label className={LABEL_CLASS}>
          <span className={LABEL_TEXT_CLASS}>Hasta</span>
          <input
            className={INPUT_CLASS}
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </label>
        <label className={`col-span-2 sm:col-span-4 ${LABEL_CLASS}`}>
          <span className={LABEL_TEXT_CLASS}>Lugar (opcional)</span>
          <input
            className={INPUT_CLASS}
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="Pabellón"
          />
        </label>
        <label className={`col-span-2 sm:col-span-4 ${LABEL_CLASS}`}>
          <span className={LABEL_TEXT_CLASS}>Enlace de Google Maps (opcional)</span>
          <input
            className={INPUT_CLASS}
            type="url"
            inputMode="url"
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/…"
          />
        </label>
        {badLink && (
          <p className={`col-span-2 sm:col-span-4 ${ERROR_CLASS}`}>
            Ese enlace no es de Google Maps.
          </p>
        )}
        {addSlot.isError && (
          <p className={`col-span-2 sm:col-span-4 ${ERROR_CLASS}`}>
            No se ha podido añadir. La hora de fin tiene que ser después de la de inicio.
          </p>
        )}
        <button
          type="submit"
          disabled={addSlot.isPending}
          className={`col-span-2 sm:col-span-4 ${PRIMARY_BUTTON_CLASS}`}
        >
          Añadir entrenamiento
        </button>
      </form>
    </Card>
  )
}
