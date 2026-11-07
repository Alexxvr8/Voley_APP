// Strip under the header: "Sin conexión" while offline and how many rotation changes wait to be sent.
import { useOnline } from '../online'
import { usePendingChanges } from '../outbox'

export function ConnectionBanner() {
  const online = useOnline()
  const pending = usePendingChanges()
  if (online && pending === 0) return null

  return (
    <p
      role="status"
      className={`px-4 py-2 text-center text-xs font-medium ${online ? 'bg-blue-50 text-blue-900' : 'bg-amber-100 text-amber-900'}`}
    >
      {online
        ? `Enviando ${pending} ${pending === 1 ? 'cambio' : 'cambios'} de rotación…`
        : 'Sin conexión. Puedes ver lo descargado y trabajar con las rotaciones' +
          (pending
            ? ` (${pending} ${pending === 1 ? 'cambio pendiente' : 'cambios pendientes'} de enviar).`
            : '.')}
    </p>
  )
}
