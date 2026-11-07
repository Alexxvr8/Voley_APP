// Edge Function: emails a one-hour password reset link to the recovery email of a username.
// Sends through Brevo's HTTP API (free plan). Always answers the same way whether the username
// exists or not, so nobody can find out which usernames have an email.
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function reply(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

/** Spanish email body with the reset button. */
function emailHtml(link: string): string {
  return `
    <p>Hola,</p>
    <p>Alguien ha pedido cambiar la contraseña de tu cuenta de Voley APP.</p>
    <p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#1e40af;color:#fff;border-radius:10px;text-decoration:none;font-weight:bold">Poner una contraseña nueva</a></p>
    <p>El enlace sirve una sola vez y caduca en 1 hora. Si no lo has pedido tú, ignora este correo.</p>`
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (request.method !== 'POST') return reply({ ok: false }, 405)

  const brevoKey = Deno.env.get('BREVO_API_KEY')
  const senderEmail = Deno.env.get('MAIL_SENDER_EMAIL')
  if (!brevoKey || !senderEmail) return reply({ ok: false, reason: 'not_configured' })

  const { username } = await request.json().catch(() => ({ username: '' }))
  if (typeof username !== 'string' || !username.trim()) return reply({ ok: false }, 400)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data, error } = await admin.rpc('issue_email_reset_token', { username })
  if (error) return reply({ ok: false }, 500)
  // No recovery email (or one sent less than a minute ago): same answer as a success.
  if (!data) return reply({ ok: true })

  const appUrl = Deno.env.get('APP_URL') ?? 'https://voley-app-gold.vercel.app'
  const link = `${appUrl}/?recuperar=${data.token}&usuario=${encodeURIComponent(username.trim().toLowerCase())}`
  const sent = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': brevoKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: senderEmail, name: Deno.env.get('MAIL_SENDER_NAME') ?? 'Voley APP' },
      to: [{ email: data.email }],
      subject: 'Cambia tu contraseña de Voley APP',
      htmlContent: emailHtml(link),
    }),
  })
  return sent.ok ? reply({ ok: true }) : reply({ ok: false }, 502)
})
