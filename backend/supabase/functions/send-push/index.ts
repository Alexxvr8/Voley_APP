// Edge Function: delivers a Web Push notification to every device of some users. Only the database
// calls it (pg_net, with the webhook secret kept in Vault). On its first run it creates the VAPID
// keys and stores them in Vault; devices that no longer exist are removed.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import * as webpush from 'jsr:@negrel/webpush@0.3.0'

/** Who runs the app server, as push services ask for (the app's address). */
const CONTACT = 'https://voley-app-gold.vercel.app'

interface PushRequest {
  users?: string[]
  title?: string
  body?: string
  url?: string
  tag?: string
  /** Only make sure the VAPID keys exist (first run). */
  init?: boolean
}

/** VAPID keys as stored in Vault: the browser's public key and both keys as JWK. */
interface StoredVapid {
  publicKey: string
  jwk: { publicKey: JsonWebKey; privateKey: JsonWebKey }
}

function reply(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)), (c) =>
    c.charCodeAt(0),
  )
}

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** The browser wants the public key as the raw point 0x04‖x‖y, base64url. */
function rawPublicKey(jwk: JsonWebKey): string {
  const x = fromBase64Url(jwk.x!)
  const y = fromBase64Url(jwk.y!)
  return toBase64Url(new Uint8Array([4, ...x, ...y]))
}

async function loadConfig(admin: SupabaseClient) {
  const { data, error } = await admin.rpc('push_config')
  if (error) throw error
  return data as { secret: string | null; vapid: StoredVapid | null }
}

/** Creates and stores the VAPID keys if there are none yet; returns the stored ones. */
async function ensureVapid(admin: SupabaseClient, stored: StoredVapid | null): Promise<StoredVapid> {
  if (stored) return stored
  const pair = await webpush.generateVapidKeys({ extractable: true })
  const jwk = await webpush.exportVapidKeys(pair)
  const created: StoredVapid = { publicKey: rawPublicKey(jwk.publicKey), jwk }
  const { error } = await admin.rpc('save_vapid_keys', { keys: created })
  if (error) throw error
  // Another call may have saved its keys first: always use what Vault holds.
  return (await loadConfig(admin)).vapid ?? created
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return reply({ ok: false }, 405)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const config = await loadConfig(admin)
  if (!config.secret || request.headers.get('x-push-secret') !== config.secret) {
    return reply({ ok: false }, 401)
  }

  const message = (await request.json().catch(() => ({}))) as PushRequest
  const vapid = await ensureVapid(admin, config.vapid)
  if (message.init) return reply({ ok: true, publicKey: vapid.publicKey })

  const users = (message.users ?? []).filter((id) => typeof id === 'string')
  if (users.length === 0 || !message.title) return reply({ ok: true, sent: 0 })

  const { data: devices, error } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', users)
  if (error) return reply({ ok: false }, 500)

  const server = await webpush.ApplicationServer.new({
    contactInformation: CONTACT,
    vapidKeys: await webpush.importVapidKeys(vapid.jwk, { extractable: false }),
  })
  const payload = JSON.stringify({
    title: message.title,
    body: message.body ?? '',
    url: message.url ?? '/',
    tag: message.tag,
  })

  const gone: string[] = []
  let sent = 0
  await Promise.all(
    (devices ?? []).map(async (device) => {
      try {
        await server
          .subscribe({ endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } })
          .pushTextMessage(payload, { ttl: 24 * 60 * 60, urgency: webpush.Urgency.Normal })
        sent++
      } catch (failure) {
        // The device unsubscribed or the app was uninstalled: forget it.
        if (
          failure instanceof webpush.PushMessageError &&
          (failure.isGone() || failure.response.status === 404)
        ) {
          gone.push(device.endpoint)
        } else {
          console.error('push failed', String(failure))
        }
      }
    }),
  )
  if (gone.length) await admin.from('push_subscriptions').delete().in('endpoint', gone)

  return reply({ ok: true, sent, removed: gone.length })
})
