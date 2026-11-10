import type { Routine } from '@/types/routine'
import {
  clearDraft,
  DRAFT_KEY,
  isStale,
  loadDraft,
  saveDraft,
  STALE_MS,
} from './workoutDraft'
import { createWorkout } from './workoutState'

const routine: Routine = {
  id: 'r1',
  name: 'Mine',
  dayLabel: null,
  isStarter: false,
  items: [
    {
      exerciseId: 'a',
      sets: 2,
      targetType: 'reps',
      target: 8,
      restSeconds: 60,
    },
  ],
}
const workout = () =>
  createWorkout({ id: 'w1', routine, now: 1000, uid: () => 'u1' })

const fakeStorage = (initial: Record<string, string> = {}) => {
  const data = { ...initial }
  return {
    data,
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v
    },
    removeItem: (k: string) => {
      delete data[k]
    },
  } as unknown as Storage & { data: Record<string, string> }
}

describe('draft storage', () => {
  it('saves and loads a workout unchanged', () => {
    const s = fakeStorage()
    saveDraft(workout(), s)
    expect(s.data[DRAFT_KEY]).toBeDefined()
    expect(loadDraft(s)).toEqual(workout())
  })

  it('loads nothing when there is no draft', () => {
    expect(loadDraft(fakeStorage())).toBeNull()
  })

  it('ignores a truncated draft', () => {
    expect(loadDraft(fakeStorage({ [DRAFT_KEY]: '{"version":1,' }))).toBeNull()
  })

  it('ignores a draft from another version', () => {
    const old = { ...workout(), version: 2 }
    expect(
      loadDraft(fakeStorage({ [DRAFT_KEY]: JSON.stringify(old) })),
    ).toBeNull()
  })

  it('ignores a draft with a missing field', () => {
    const { routineName: _gone, ...rest } = workout()
    expect(
      loadDraft(fakeStorage({ [DRAFT_KEY]: JSON.stringify(rest) })),
    ).toBeNull()
  })

  it('does not throw when storage fails', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('full')
      },
      removeItem: () => {
        throw new Error('denied')
      },
    } as unknown as Storage
    expect(() => saveDraft(workout(), broken)).not.toThrow()
    expect(loadDraft(broken)).toBeNull()
    expect(() => clearDraft(broken)).not.toThrow()
  })

  it('clears the draft', () => {
    const s = fakeStorage()
    saveDraft(workout(), s)
    clearDraft(s)
    expect(loadDraft(s)).toBeNull()
  })

  it('calls a draft stale after 24 hours without a change', () => {
    const w = workout()
    expect(isStale(w, w.updatedAt + STALE_MS - 60000)).toBe(false)
    expect(isStale(w, w.updatedAt + STALE_MS + 60000)).toBe(true)
  })
})
