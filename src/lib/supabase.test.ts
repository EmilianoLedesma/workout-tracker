const createClient = vi.hoisted(() => vi.fn(() => ({})))
vi.mock('@supabase/supabase-js', () => ({ createClient }))

beforeEach(() => {
  vi.resetModules()
  createClient.mockClear()
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'publishable-key')
})

afterEach(() => vi.unstubAllEnvs())

it('keeps the session in the browser and refreshes its token', async () => {
  const { getSupabase } = await import('./supabase')
  getSupabase()
  expect(createClient).toHaveBeenCalledWith(
    'https://example.supabase.co',
    'publishable-key',
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  )
})

it('creates the client only once', async () => {
  const { getSupabase } = await import('./supabase')
  expect(getSupabase()).toBe(getSupabase())
  expect(createClient).toHaveBeenCalledTimes(1)
})
