import { parseEnv } from './env'

it('fails and lists both vars when empty', () => {
  expect(parseEnv({})).toEqual({
    ok: false,
    missing: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
  })
})

it('fails for an invalid URL', () => {
  const result = parseEnv({
    VITE_SUPABASE_URL: 'not-a-url',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x',
  })
  expect(result).toEqual({ ok: false, missing: ['VITE_SUPABASE_URL'] })
})

it('succeeds with a valid URL and key', () => {
  const result = parseEnv({
    VITE_SUPABASE_URL: 'https://abc.supabase.co',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x',
  })
  expect(result).toEqual({
    ok: true,
    env: {
      supabaseUrl: 'https://abc.supabase.co',
      supabasePublishableKey: 'sb_publishable_x',
    },
  })
})
