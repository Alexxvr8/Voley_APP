import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY (see .env.example)')
}

// The session is persisted in localStorage and refreshed automatically, so users stay
// signed in across app restarts and while offline (see SPEC "Registro y sesión").
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
})
