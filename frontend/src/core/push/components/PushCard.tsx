// "Avisos" in Mi cuenta: turn notifications on or off on this phone and send a test one.
import { useState } from 'react'
import { Card } from '@/shared/ui/Card'
import { ERROR_CLASS, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '@/shared/ui/form'
import { sendTestPush } from '../push'
import { usePush } from '../usePush'

export function PushCard() {
  const { state, busy, failed, enable, disable } = usePush()
  const [tested, setTested] = useState<'idle' | 'sent' | 'failed'>('idle')

  async function test() {
    try {
      await sendTestPush()
      setTested('sent')
    } catch {
      setTested('failed')
    }
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-semibold">Avisos en este móvil</p>
        <p className="text-sm text-slate-500">
          Nuevos partidos, convocatorias, recordatorios de partido y entrenamiento, y la votación de
          la MVP.
        </p>
      </div>

      {state === 'unsupported' && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Este navegador no admite avisos. En iPhone, primero añade la app a la pantalla de inicio
          (Compartir → Añadir a pantalla de inicio) y ábrela desde ahí.
        </p>
      )}
      {state === 'denied' && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Los avisos están bloqueados. Actívalos en los ajustes del móvil (Notificaciones → Voley
          APP o el navegador) y vuelve aquí.
        </p>
      )}
      {state === 'on' && (
        <p className="text-sm font-medium text-emerald-700">✓ Avisos activados en este móvil.</p>
      )}
      {failed && <p className={ERROR_CLASS}>No se ha podido. ¿Hay conexión?</p>}

      {state === 'off' && (
        <button
          type="button"
          disabled={busy}
          onClick={enable}
          className={`w-full ${PRIMARY_BUTTON_CLASS}`}
        >
          {busy ? 'Activando…' : 'Activar avisos'}
        </button>
      )}
      {state === 'on' && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={test} className={SECONDARY_BUTTON_CLASS}>
            Enviar prueba
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={disable}
            className={SECONDARY_BUTTON_CLASS}
          >
            Desactivar
          </button>
        </div>
      )}
      {tested === 'sent' && (
        <p className="text-sm text-slate-500">Enviado. Debería llegarte en unos segundos.</p>
      )}
      {tested === 'failed' && <p className={ERROR_CLASS}>No se ha podido enviar la prueba.</p>}
    </Card>
  )
}
