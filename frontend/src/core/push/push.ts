// Push notifications on this device: whether the browser supports them, turning them on (permission,
// Web Push subscription saved in Supabase) and off, and a test notification.
import { supabase } from '@/core/supabase/client'

/** `unsupported` (old browser, or iPhone not installed), `denied` (blocked in the phone settings). */
export type PushState = 'unsupported' | 'denied' | 'off' | 'on'

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** Bytes of the base64url VAPID public key, as `PushManager.subscribe` wants them. */
export function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission !== 'granted') return 'off'
  return (await currentSubscription()) ? 'on' : 'off'
}

/** Asks for permission, subscribes this device and saves it for the signed-in user. */
export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported'
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'

  const { data: publicKey, error } = await supabase.rpc('vapid_public_key')
  if (error || !publicKey) throw error ?? new Error('Sin clave de avisos')
  const registration = await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(publicKey as string),
    }))
  const json = subscription.toJSON()
  const { error: saveError } = await supabase.from('push_subscriptions').upsert({
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
  })
  if (saveError) throw saveError
  return 'on'
}

/** Stops notifications on this device (also when signing out, so the next account gets none). */
export async function disablePush(): Promise<void> {
  if (!pushSupported()) return
  const subscription = await currentSubscription()
  if (!subscription) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
}

/** Sends a notification to the signed-in user's devices, to check it works. */
export async function sendTestPush(): Promise<void> {
  const { error } = await supabase.rpc('send_test_push')
  if (error) throw error
}
