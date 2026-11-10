import { act, renderHook } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import { AuthContext } from '@/features/auth/useSession'
import type { Routine, RoutineExercise } from '@/types/routine'
import { clearDraft, loadDraft, saveDraft } from './workoutDraft'
import { createWorkout, reduce } from './workoutState'
import { useWorkoutSession } from './useWorkoutSession'

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  alert: vi.fn(),
  prepare: vi.fn(),
  keep: vi.fn(),
  off: vi.fn(),
}))

vi.mock('./useSaveSession', () => ({
  useSaveSession: () => ({ mutateAsync: mocks.save }),
}))
vi.mock('./alerts', () => ({
  prepareAudio: mocks.prepare,
  alertCountdownEnd: mocks.alert,
  keepScreenOn: mocks.keep,
}))

const T0 = 1_000_000
let session: Session | null = null

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthContext value={{ session, loading: false, signOut: async () => {} }}>
    {children}
  </AuthContext>
)

const item = (
  exerciseId: string,
  over: Partial<RoutineExercise> = {},
): RoutineExercise => ({
  exerciseId,
  sets: 1,
  targetType: 'reps',
  target: 8,
  restSeconds: 60,
  ...over,
})

const timed = item('p', { targetType: 'seconds', target: 30 })
const routine = (...items: RoutineExercise[]): Routine => ({
  id: 'r1',
  name: 'Mine',
  dayLabel: null,
  isStarter: false,
  items,
})

const flush = () => act(async () => {})
const tick = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
  vi.setSystemTime(T0)
  localStorage.clear()
  session = { user: { id: 'u1' } } as Session
  Object.values(mocks).forEach((m) => m.mockReset())
  mocks.save.mockResolvedValue(undefined)
  mocks.keep.mockResolvedValue(mocks.off)
})
afterEach(() => {
  vi.useRealTimers()
})

describe('draft', () => {
  it('continues a saved draft and mirrors every change back to it', async () => {
    const draft = createWorkout({
      id: 'w1',
      routine: routine(item('a')),
      now: T0,
      uid: () => 'u1',
    })
    saveDraft(draft)
    const { result } = renderHook(() => useWorkoutSession(), { wrapper })
    expect(result.current.workout).toEqual(draft)
    act(() => result.current.act({ type: 'adjustTarget', delta: 1 }))
    expect(loadDraft()?.exercises[0].sets[0].target).toBe(9)
    await flush()
  })

  it('starts a workout, keeps the screen on and can discard it', async () => {
    const { result, unmount } = renderHook(() => useWorkoutSession(), {
      wrapper,
    })
    act(() => result.current.start(routine(item('a'))))
    await flush()
    expect(result.current.workout?.routineId).toBe('r1')
    expect(loadDraft()?.id).toBe(result.current.workout?.id)
    expect(mocks.prepare).toHaveBeenCalled()
    expect(mocks.keep).toHaveBeenCalledTimes(1)

    act(() => result.current.discard())
    expect(result.current.workout).toBeNull()
    expect(loadDraft()).toBeNull()
    expect(mocks.off).toHaveBeenCalled()
    unmount()
  })

  it('asks for the screen lock again when the page comes back', async () => {
    const { result } = renderHook(() => useWorkoutSession(), { wrapper })
    act(() => result.current.start(routine(item('a'))))
    await flush()
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await flush()
    expect(mocks.keep).toHaveBeenCalledTimes(2)
    expect(mocks.off).toHaveBeenCalledTimes(1)
  })
})

describe('time', () => {
  it('stamps actions with the current time', () => {
    const { result } = renderHook(() => useWorkoutSession(), { wrapper })
    act(() => result.current.start(routine(timed)))
    tick(5000)
    act(() => result.current.act({ type: 'startTimer' }))
    expect(result.current.workout?.timer).toEqual({ endsAt: T0 + 5000 + 30000 })
  })

  it('alerts once when a countdown ends and completes the timed set', () => {
    const { result } = renderHook(() => useWorkoutSession(), { wrapper })
    act(() => result.current.start(routine(timed, item('a'))))
    act(() => result.current.act({ type: 'startTimer' }))
    tick(29000)
    expect(mocks.alert).not.toHaveBeenCalled()
    tick(2000)
    expect(mocks.alert).toHaveBeenCalledTimes(1)
    expect(result.current.workout?.exercises[0].sets[0].actual).toBe(30)
    expect(result.current.workout?.phase).toBe('rest')
    tick(5000)
    expect(mocks.alert).toHaveBeenCalledTimes(1)
  })

  it('alerts once on return when the countdown ended while the app was closed', () => {
    const w = reduce(
      createWorkout({
        id: 'w1',
        routine: routine(timed),
        now: T0,
        uid: () => 'u1',
      }),
      { type: 'startTimer', now: T0 },
    )
    saveDraft(w)
    vi.setSystemTime(T0 + 120000)
    const { result } = renderHook(() => useWorkoutSession(), { wrapper })
    expect(mocks.alert).toHaveBeenCalledTimes(1)
    expect(result.current.workout?.exercises[0].sets[0].actual).toBe(30)
  })
})

describe('finishing and saving', () => {
  const finishOnce = (result: {
    current: ReturnType<typeof useWorkoutSession>
  }) => {
    act(() => result.current.start(routine(item('a'))))
    act(() => result.current.act({ type: 'completeSet' }))
    act(() => result.current.act({ type: 'finish', note: 'n' }))
  }

  it('saves the payload, clears the draft and keeps a summary', async () => {
    const { result } = renderHook(() => useWorkoutSession(), { wrapper })
    finishOnce(result)
    await flush()
    expect(mocks.save).toHaveBeenCalledTimes(1)
    expect(mocks.save.mock.calls[0][0]).toMatchObject({
      routineId: 'r1',
      status: 'completed',
      note: 'n',
    })
    expect(loadDraft()).toBeNull()
    expect(result.current.workout).toBeNull()
    expect(result.current.save.status).toBe('saved')
    expect(result.current.summary?.routineName).toBe('Mine')
  })

  it('keeps the draft when saving fails and saves the same workout on retry', async () => {
    mocks.save.mockRejectedValueOnce(new Error('offline'))
    const { result } = renderHook(() => useWorkoutSession(), { wrapper })
    finishOnce(result)
    await flush()
    expect(result.current.save.status).toBe('error')
    expect(loadDraft()?.finish).not.toBeNull()

    act(() => result.current.save.retry())
    await flush()
    expect(result.current.save.status).toBe('saved')
    expect(mocks.save).toHaveBeenCalledTimes(2)
    expect(mocks.save.mock.calls[0][0].id).toBe(mocks.save.mock.calls[1][0].id)
    expect(loadDraft()).toBeNull()
  })

  it('saves at once when the app opens on an unsaved finished workout', async () => {
    const done = reduce(
      createWorkout({
        id: 'w1',
        routine: routine(item('a')),
        now: T0,
        uid: () => 'u1',
      }),
      { type: 'finish', note: '', now: T0 + 1000 },
    )
    saveDraft(done)
    renderHook(() => useWorkoutSession(), { wrapper })
    await flush()
    expect(mocks.save).toHaveBeenCalledTimes(1)
  })

  it('waits for a signed-in user before saving', async () => {
    session = null
    const { result } = renderHook(() => useWorkoutSession(), { wrapper })
    finishOnce(result)
    await flush()
    expect(mocks.save).not.toHaveBeenCalled()
    clearDraft()
  })
})
