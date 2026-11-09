// Venue field: tap one of the team's usual venues (with its Google Maps link) or "Otro" to type
// another one with its link.
import { useState } from 'react'
import type { TeamVenue } from '@/shared/domain/types'
import { ChoiceChips } from '@/shared/ui/ChoiceChips'
import { INPUT_CLASS, LABEL_CLASS, LABEL_TEXT_CLASS } from '@/shared/ui/form'
import { isValidMapsUrl } from '@/shared/utils/maps'

export interface VenueValue {
  venue: string
  mapsUrl: string
}

interface VenuePickerProps {
  venues: TeamVenue[]
  value: VenueValue
  onChange: (value: VenueValue) => void
  /** Label of the field, e.g. "Pabellón" or "Lugar". */
  label: string
}

const NONE = 'none'
const OTHER = 'other'

function findVenue(venues: TeamVenue[], value: VenueValue): TeamVenue | undefined {
  return venues.find((v) => v.name === value.venue && v.mapsUrl === value.mapsUrl)
}

export function VenuePicker({ venues, value, onChange, label }: VenuePickerProps) {
  // Typing a venue by hand: no list yet, or the saved value is not one of the team's venues.
  const [custom, setCustom] = useState(
    venues.length === 0 || (value.venue !== '' && !findVenue(venues, value)),
  )
  const selected = findVenue(venues, value)

  function pick(choice: string) {
    if (choice === OTHER) {
      setCustom(true)
      onChange({ venue: '', mapsUrl: '' })
      return
    }
    setCustom(false)
    const venue = venues.find((v) => v.id === choice)
    onChange(venue ? { venue: venue.name, mapsUrl: venue.mapsUrl } : { venue: '', mapsUrl: '' })
  }

  return (
    <div className="flex flex-col gap-3">
      {venues.length > 0 && (
        <div className={LABEL_CLASS}>
          <span className={LABEL_TEXT_CLASS}>{label}</span>
          <ChoiceChips
            label={label}
            choices={[
              ...venues.map((venue) => ({ value: venue.id, label: venue.name })),
              { value: OTHER, label: 'Otro…' },
              { value: NONE, label: 'Sin indicar' },
            ]}
            value={custom ? OTHER : (selected?.id ?? NONE)}
            onChange={pick}
          />
        </div>
      )}

      {custom && (
        <>
          <label className={LABEL_CLASS}>
            <span className={LABEL_TEXT_CLASS}>
              {venues.length ? `Otro ${label.toLowerCase()}` : label}
            </span>
            <input
              className={INPUT_CLASS}
              value={value.venue}
              onChange={(e) => onChange({ ...value, venue: e.target.value })}
            />
          </label>
          <label className={LABEL_CLASS}>
            <span className={LABEL_TEXT_CLASS}>Enlace de Google Maps (opcional)</span>
            <input
              className={INPUT_CLASS}
              type="url"
              inputMode="url"
              value={value.mapsUrl}
              onChange={(e) => onChange({ ...value, mapsUrl: e.target.value })}
              placeholder="https://maps.app.goo.gl/…"
            />
            <span className="text-xs text-slate-500">
              En Google Maps: Compartir → Copiar enlace.
            </span>
          </label>
          {!isValidMapsUrl(value.mapsUrl) && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              Ese enlace no es de Google Maps.
            </p>
          )}
        </>
      )}
    </div>
  )
}
