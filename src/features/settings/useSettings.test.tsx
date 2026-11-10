import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import { AuthContext } from '@/features/auth/useSession'
import { DEFAULT_SETTINGS, useSettings, useUpdateSettings } from './useSettings'

const mocks = vi.hoisted(() => ({ maybeSingle: vi.fn(), upsert: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }),
      upsert: mocks.upsert,
    }),
  }),
}))

const session = { user: { id: 'u1' } } as Session

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthContext value={{ session, loading: false, signOut: async () => {} }}>
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  </AuthContext>
)

beforeEach(() => {
  mocks.maybeSingle.mockReset()
  mocks.upsert.mockReset()
})

it('returns the defaults when the user has no settings row', async () => {
  mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
  const { result } = renderHook(() => useSettings(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
  expect(result.current.error).toBeNull()
})

it('maps an existing row to settings', async () => {
  mocks.maybeSingle.mockResolvedValue({
    data: {
      weekly_goal: 5,
      equipment: ['bodyweight', 'nonsense'],
      theme: 'dark',
      starters_seeded: true,
    },
    error: null,
  })
  const { result } = renderHook(() => useSettings(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.settings).toEqual({
    weeklyGoal: 5,
    equipment: ['bodyweight'],
    theme: 'dark',
    startersSeeded: true,
  })
})

it('treats a missing settings row as starters not yet added', async () => {
  mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
  const { result } = renderHook(() => useSettings(), { wrapper })
  await waitFor(() => expect(result.current.isLoading).toBe(false))
  expect(result.current.settings.startersSeeded).toBe(false)
})

it('upserts with user_id and snake_case columns', async () => {
  mocks.upsert.mockResolvedValue({ error: null })
  const { result } = renderHook(() => useUpdateSettings(), { wrapper })
  await result.current.mutateAsync({ equipment: ['wall'], weeklyGoal: 4 })
  expect(mocks.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      user_id: 'u1',
      equipment: ['wall'],
      weekly_goal: 4,
    }),
    { onConflict: 'user_id' },
  )
})

it('rejects when the upsert fails', async () => {
  mocks.upsert.mockResolvedValue({ error: { message: 'nope' } })
  const { result } = renderHook(() => useUpdateSettings(), { wrapper })
  await expect(result.current.mutateAsync({ weeklyGoal: 2 })).rejects.toThrow(
    'nope',
  )
})
