// The team's usual venues with their Google Maps link. Matches and trainings pick from this list.
import { useState, type FormEvent } from 'react'
import { Card } from '@/shared/ui/Card'
import { ERROR_CLASS, INPUT_CLASS, PRIMARY_BUTTON_CLASS } from '@/shared/ui/form'
import { isValidMapsUrl } from '@/shared/utils/maps'
import { mapsOpenUrl } from '@/shared/utils/maps'
import { useAddVenue, useDeleteVenue, useTeamVenues } from '../api'

export function VenuesCard({ teamId }: { teamId: string }) {
  const venues = useTeamVenues(teamId)
  const addVenue = useAddVenue(teamId)
  const deleteVenue = useDeleteVenue(teamId)
  const [name, setName] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const badLink = !isValidMapsUrl(mapsUrl)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (badLink) return
    addVenue.mutate(
      { name: name.trim(), mapsUrl: mapsUrl.trim() },
      {
        onSuccess: () => {
          setName('')
          setMapsUrl('')
        },
      },
    )
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-semibold">Pabellones</p>
        <p className="text-sm text-slate-500">
          Los habituales del equipo. Al crear un partido o un entreno se eligen de aquí.
        </p>
      </div>
      {venues.data?.length === 0 && (
        <p className="text-sm text-slate-500">Aún no hay pabellones.</p>
      )}
      {venues.data?.map((venue) => (
        <div
          key={venue.id}
          className="flex items-center gap-3 border-t border-slate-100 pt-3 text-sm"
        >
          <a
            href={mapsOpenUrl(venue.mapsUrl, venue.name)}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate font-medium text-blue-800 underline"
          >
            {venue.name}
          </a>
          {!venue.mapsUrl && <span className="text-xs text-slate-400">sin enlace</span>}
          <button
            type="button"
            onClick={() => deleteVenue.mutate(venue.id)}
            className="text-xs font-medium text-rose-700 underline"
          >
            Quitar
          </button>
        </div>
      ))}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-slate-100 pt-3">
        <input
          className={INPUT_CLASS}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del pabellón"
          aria-label="Nombre del pabellón"
          required
        />
        <input
          className={INPUT_CLASS}
          type="url"
          inputMode="url"
          value={mapsUrl}
          onChange={(e) => setMapsUrl(e.target.value)}
          placeholder="Enlace de Google Maps (opcional)"
          aria-label="Enlace de Google Maps del pabellón"
        />
        {badLink && <p className={ERROR_CLASS}>Ese enlace no es de Google Maps.</p>}
        {addVenue.isError && <p className={ERROR_CLASS}>No se ha podido añadir.</p>}
        <button
          type="submit"
          disabled={addVenue.isPending || badLink}
          className={PRIMARY_BUTTON_CLASS}
        >
          Añadir pabellón
        </button>
      </form>
    </Card>
  )
}
