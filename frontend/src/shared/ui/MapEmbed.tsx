// Embedded Google map of a venue with a link to open it in the Maps app.
import { mapsEmbedUrl, mapsOpenUrl } from '@/shared/utils/maps'

export function MapEmbed({ venue, mapsUrl }: { venue: string; mapsUrl: string }) {
  if (!venue && !mapsUrl) return null

  return (
    <div className="space-y-2">
      <iframe
        title={`Mapa de ${venue || 'la ubicación'}`}
        src={mapsEmbedUrl(mapsUrl, venue)}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-56 w-full rounded-xl border-0 bg-slate-100 lg:h-72"
      />
      <a
        href={mapsOpenUrl(mapsUrl, venue)}
        target="_blank"
        rel="noreferrer"
        className="inline-block text-sm font-medium text-blue-800 underline"
      >
        Abrir en Google Maps
      </a>
    </div>
  )
}
