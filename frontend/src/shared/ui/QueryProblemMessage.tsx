// Message of a screen whose data is not ready: loading, no network with nothing saved, or an error.
import { PageMessage } from './PageMessage'

const MESSAGES = {
  loading: 'Cargando…',
  offline:
    'Sin conexión, y esto no está guardado en el móvil. Ábrelo una vez con internet para tenerlo sin red.',
  error: 'No se ha podido cargar. ¿Hay conexión?',
}

export function QueryProblemMessage({ problem }: { problem: keyof typeof MESSAGES }) {
  return <PageMessage>{MESSAGES[problem]}</PageMessage>
}
