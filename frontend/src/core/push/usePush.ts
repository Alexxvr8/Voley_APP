// React state of push notifications on this device, with actions that keep it up to date.
import { useCallback, useEffect, useState } from 'react'
import { disablePush, enablePush, pushState, type PushState } from './push'

export function usePush() {
  const [state, setState] = useState<PushState | 'loading'>('loading')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    pushState().then((value) => alive && setState(value))
    return () => {
      alive = false
    }
  }, [])

  const run = useCallback(async (action: () => Promise<PushState | void>) => {
    setBusy(true)
    setFailed(false)
    try {
      const next = await action()
      setState(next ?? (await pushState()))
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }, [])

  return {
    state,
    busy,
    failed,
    enable: () => run(enablePush),
    disable: () => run(disablePush),
  }
}
