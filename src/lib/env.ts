import { z } from 'zod'

const schema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
})

export type Env = { supabaseUrl: string; supabasePublishableKey: string }

export type EnvResult =
  { ok: true; env: Env } | { ok: false; missing: string[] }

export function parseEnv(raw: Record<string, unknown>): EnvResult {
  const result = schema.safeParse(raw)
  if (result.success) {
    return {
      ok: true,
      env: {
        supabaseUrl: result.data.VITE_SUPABASE_URL,
        supabasePublishableKey: result.data.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    }
  }
  const missing = [
    ...new Set(result.error.issues.map((i) => String(i.path[0]))),
  ]
  return { ok: false, missing }
}
