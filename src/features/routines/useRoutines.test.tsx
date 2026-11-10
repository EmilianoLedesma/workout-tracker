import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import { AuthContext } from '@/features/auth/useSession'
import type { Routine } from '@/types/routine'
import {
  useDeleteRoutine,
  useDuplicateRoutine,
  useRoutine,
  useRoutines,
  useSaveRoutine,
  useSeedStarters,
} from './useRoutines'

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  rpc: vi.fn(),
  deleteEq: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    from: () => ({
      select: mocks.select,
      delete: () => ({ eq: mocks.deleteEq }),
    }),
    rpc: mocks.rpc,
  }),
}))

const session = { user: { id: 'u1' } } as Session

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthContext value={{ session, loading: false, signOut: async () => {} }}>
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {children}
    </QueryClientProvider>
  </AuthContext>
)

const row = (
  id: string,
  dayLabel: string | null,
  createdAt: string,
  items: { exercise_id: string; position: number }[] = [],
) => ({
  id,
  name: `Routine ${id}`,
  day_label: dayLabel,
  is_starter: false,
  created_at: createdAt,
  routine_exercises: items.map((i) => ({
    sets: 2,
    target_type: 'reps',
    target: 8,
    rest_seconds: 60,
    ...i,
  })),
})

beforeEach(() => {
  mocks.select.mockReset()
  mocks.rpc.mockReset()
  mocks.deleteEq.mockReset()
  mocks.select.mockResolvedValue({ data: [], error: null })
  mocks.rpc.mockResolvedValue({ data: 'new-id', error: null })
  mocks.deleteEq.mockResolvedValue({ error: null })
})

describe('useRoutines', () => {
  it('maps rows, orders routines by day label (none last) and items by position', async () => {
    mocks.select.mockResolvedValue({
      data: [
        row('none', null, '2026-01-01'),
        row('c', 'C', '2026-01-02'),
        row('a', 'A', '2026-01-03', [
          { exercise_id: 'second', position: 1 },
          { exercise_id: 'first', position: 0 },
        ]),
      ],
      error: null,
    })
    const { result } = renderHook(() => useRoutines(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.routines.map((r) => r.id)).toEqual(['a', 'c', 'none'])
    expect(result.current.routines[0]).toEqual({
      id: 'a',
      name: 'Routine a',
      dayLabel: 'A',
      isStarter: false,
      items: [
        {
          exerciseId: 'first',
          sets: 2,
          targetType: 'reps',
          target: 8,
          restSeconds: 60,
        },
        {
          exerciseId: 'second',
          sets: 2,
          targetType: 'reps',
          target: 8,
          restSeconds: 60,
        },
      ],
    })
  })

  it('exposes the server error', async () => {
    mocks.select.mockResolvedValue({ data: null, error: { message: 'boom' } })
    const { result } = renderHook(() => useRoutines(), { wrapper })
    await waitFor(() => expect(result.current.error?.message).toBe('boom'))
  })
})

describe('useRoutine', () => {
  it('finds a routine by id and returns null when it does not exist', async () => {
    mocks.select.mockResolvedValue({
      data: [row('a', 'A', '2026-01-01')],
      error: null,
    })
    const found = renderHook(() => useRoutine('a'), { wrapper })
    await waitFor(() => expect(found.result.current.routine?.id).toBe('a'))
    const missing = renderHook(() => useRoutine('nope'), { wrapper })
    await waitFor(() => expect(missing.result.current.routine).toBeNull())
  })
})

describe('useSaveRoutine', () => {
  const draft = {
    name: 'Mine',
    dayLabel: 'A' as const,
    items: [
      {
        exerciseId: 'wg-plank',
        sets: 2,
        targetType: 'seconds' as const,
        target: 20,
        restSeconds: 60,
      },
    ],
  }

  it('sends the draft to save_routine and returns the id', async () => {
    const { result } = renderHook(() => useSaveRoutine(), { wrapper })
    let id: string | undefined
    await act(async () => {
      id = await result.current.mutateAsync({ id: null, draft })
    })
    expect(id).toBe('new-id')
    expect(mocks.rpc).toHaveBeenCalledWith('save_routine', {
      p_id: null,
      p_name: 'Mine',
      p_day_label: 'A',
      p_items: [
        {
          exercise_id: 'wg-plank',
          sets: 2,
          target_type: 'seconds',
          target: 20,
          rest_seconds: 60,
        },
      ],
    })
  })

  it('surfaces a server error and does not refetch the list', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'nope' } })
    const { result } = renderHook(
      () => ({ save: useSaveRoutine(), list: useRoutines() }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.list.isLoading).toBe(false))
    const calls = mocks.select.mock.calls.length
    await act(async () => {
      await result.current.save.mutateAsync({ id: 'r1', draft }).catch(() => {})
    })
    await waitFor(() => expect(result.current.save.error?.message).toBe('nope'))
    expect(mocks.select.mock.calls.length).toBe(calls)
  })
})

describe('useDeleteRoutine', () => {
  it('deletes the routine by id', async () => {
    const { result } = renderHook(() => useDeleteRoutine(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('r1')
    })
    expect(mocks.deleteEq).toHaveBeenCalledWith('id', 'r1')
  })
})

describe('useDuplicateRoutine', () => {
  const source = (name: string): Routine => ({
    id: 'r1',
    name,
    dayLabel: 'B',
    isStarter: true,
    items: [
      {
        exerciseId: 'wg-squat',
        sets: 3,
        targetType: 'reps',
        target: 10,
        restSeconds: 90,
      },
    ],
  })

  it('creates a copy with no day label', async () => {
    const { result } = renderHook(() => useDuplicateRoutine(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync(source('Legs'))
    })
    expect(mocks.rpc).toHaveBeenCalledWith(
      'save_routine',
      expect.objectContaining({
        p_id: null,
        p_name: 'Legs (copy)',
        p_day_label: null,
      }),
    )
  })

  it('keeps a long name within 60 characters', async () => {
    const { result } = renderHook(() => useDuplicateRoutine(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync(source('x'.repeat(60)))
    })
    const name = mocks.rpc.mock.calls[0][1].p_name as string
    expect(name).toHaveLength(60)
    expect(name.endsWith(' (copy)')).toBe(true)
  })
})

describe('useSeedStarters', () => {
  it('sends the three starter routines in snake_case', async () => {
    const { result } = renderHook(() => useSeedStarters(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync()
    })
    const [fn, args] = mocks.rpc.mock.calls[0]
    expect(fn).toBe('seed_starter_routines')
    expect(args.p_routines).toHaveLength(3)
    expect(args.p_routines[0]).toMatchObject({
      name: 'Full body baseline',
      day_label: 'A',
    })
    expect(args.p_routines[0].items[0]).toEqual({
      exercise_id: 'wg-wall-push-up',
      sets: 2,
      target_type: 'reps',
      target: 8,
      rest_seconds: 60,
    })
  })
})
