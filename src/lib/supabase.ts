import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { parseEnv } from './env'

let client: SupabaseClient | undefined

export function getSupabase(): SupabaseClient {
  if (client) return client
  const result = parseEnv(import.meta.env)
  if (!result.ok) {
    throw new Error(`Missing or invalid env: ${result.missing.join(', ')}`)
  }
  client = createClient(
    result.env.supabaseUrl,
    result.env.supabasePublishableKey,
    {
      // The session lives in the browser's storage and the access token is
      // refreshed automatically, so the owner stays signed in across visits.
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  )
  return client
}
