import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import { AuthContext } from '@/features/auth/useSession'
import type { SessionPayload } from './workoutState'
import { useSaveSession } from './useSaveSession'

const mocks = vi.hoisted(() => ({ upsert: vi.fn(), from: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    from: (table: string) => {
      mocks.from(table)
      return { upsert: mocks.upsert }
    },
  }),
}))

const payload: SessionPayload = {
  id: 'w1',
  routineId: 'r1',
  routineName: 'Mine',
  startedAt: '2026-11-10T10:00:00.000Z',
  finishedAt: '2026-11-10T10:20:00.000Z',
  durationSeconds: 1200,
  status: 'partial',
  note: 'ok',
  log: [
    {
      exercise_id: 'a',
      target_type: 'reps',
      status: 'active',
      sets: [{ target: 8, actual: 8, rest_seconds: 60 }],
    },
  ],
}

const wrapperFor =
  (session: Session | null) =>
  ({ children }: { children: ReactNode }) => (
    <AuthContext value={{ session, loading: false, signOut: async () => {} }}>
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { mutations: { retry: false } } })
        }
      >
        {children}
      </QueryClientProvider>
    </AuthContext>
  )

const signedIn = { user: { id: 'u1' } } as Session

beforeEach(() => {
  mocks.upsert.mockReset()
  mocks.from.mockReset()
  mocks.upsert.mockResolvedValue({ error: null })
})

it('inserts one row with snake_case columns, ignoring a duplicate id', async () => {
  const { result } = renderHook(() => useSaveSession(), {
    wrapper: wrapperFor(signedIn),
  })
  await act(async () => {
    await result.current.mutateAsync(payload)
  })
  expect(mocks.from).toHaveBeenCalledWith('sessions')
  expect(mocks.upsert).toHaveBeenCalledWith(
    {
      id: 'w1',
      user_id: 'u1',
      routine_id: 'r1',
      routine_name: 'Mine',
      started_at: '2026-11-10T10:00:00.000Z',
      finished_at: '2026-11-10T10:20:00.000Z',
      duration_seconds: 1200,
      status: 'partial',
      note: 'ok',
      log: payload.log,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  )
})

it('sends the same id on every attempt so a retry cannot add a second row', async () => {
  const { result } = renderHook(() => useSaveSession(), {
    wrapper: wrapperFor(signedIn),
  })
  await act(async () => {
    await result.current.mutateAsync(payload)
    await result.current.mutateAsync(payload)
  })
  const ids = mocks.upsert.mock.calls.map((c) => c[0].id)
  expect(ids).toEqual(['w1', 'w1'])
})

it('saves without the routine link when the routine was deleted meanwhile', async () => {
  mocks.upsert
    .mockResolvedValueOnce({ error: { code: '23503', message: 'fk' } })
    .mockResolvedValueOnce({ error: null })
  const { result } = renderHook(() => useSaveSession(), {
    wrapper: wrapperFor(signedIn),
  })
  await act(async () => {
    await result.current.mutateAsync(payload)
  })
  expect(mocks.upsert).toHaveBeenCalledTimes(2)
  expect(mocks.upsert.mock.calls[0][0].routine_id).toBe('r1')
  expect(mocks.upsert.mock.calls[1][0].routine_id).toBeNull()
  expect(mocks.upsert.mock.calls[1][0].id).toBe('w1')
})

it('does not retry other errors', async () => {
  mocks.upsert.mockResolvedValue({ error: { code: '23514', message: 'check' } })
  const { result } = renderHook(() => useSaveSession(), {
    wrapper: wrapperFor(signedIn),
  })
  await expect(
    act(async () => {
      await result.current.mutateAsync(payload)
    }),
  ).rejects.toThrow('check')
  expect(mocks.upsert).toHaveBeenCalledTimes(1)
})

it('rejects when the server returns an error', async () => {
  mocks.upsert.mockResolvedValue({ error: { message: 'boom' } })
  const { result } = renderHook(() => useSaveSession(), {
    wrapper: wrapperFor(signedIn),
  })
  await expect(
    act(async () => {
      await result.current.mutateAsync(payload)
    }),
  ).rejects.toThrow('boom')
})

it('does not call Supabase when nobody is signed in', async () => {
  const { result } = renderHook(() => useSaveSession(), {
    wrapper: wrapperFor(null),
  })
  await expect(
    act(async () => {
      await result.current.mutateAsync(payload)
    }),
  ).rejects.toThrow()
  expect(mocks.upsert).not.toHaveBeenCalled()
})
