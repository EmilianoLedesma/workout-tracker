import type { Routine, RoutineExercise } from '@/types/routine'
import { remainingMs } from './timer'
import {
  counts,
  createWorkout,
  currentSet,
  reduce,
  toSessionPayload,
  type Action,
} from './workoutState'

const item = (
  exerciseId: string,
  over: Partial<RoutineExercise> = {},
): RoutineExercise => ({
  exerciseId,
  sets: 2,
  targetType: 'reps',
  target: 8,
  restSeconds: 60,
  ...over,
})

const routine = (...items: RoutineExercise[]): Routine => ({
  id: 'r1',
  name: 'Mine',
  dayLabel: null,
  isStarter: false,
  items,
})

let n = 0
const uid = () => `u${++n}`
beforeEach(() => {
  n = 0
})

const start = (...items: RoutineExercise[]) =>
  createWorkout({ id: 'w1', routine: routine(...items), now: 0, uid })

const run = (w: ReturnType<typeof start>, ...actions: Action[]) =>
  actions.reduce(reduce, w)

describe('createWorkout', () => {
  it('copies the routine into a session at the first set', () => {
    const w = start(item('a'), item('b', { sets: 1, restSeconds: 30 }))
    expect(w).toMatchObject({
      version: 1,
      id: 'w1',
      routineId: 'r1',
      routineName: 'Mine',
      startedAt: 0,
      cursor: { exercise: 0, set: 0 },
      phase: 'set',
      timer: null,
      lastDone: null,
      paused: false,
      pausedMs: 0,
      finish: null,
    })
    expect(w.exercises).toHaveLength(2)
    expect(w.exercises[0]).toEqual({
      uid: 'u1',
      exerciseId: 'a',
      targetType: 'reps',
      status: 'active',
      sets: [
        { target: 8, actual: null, restSeconds: 60 },
        { target: 8, actual: null, restSeconds: 60 },
      ],
    })
    expect(w.exercises[1].sets).toEqual([
      { target: 8, actual: null, restSeconds: 30 },
    ])
  })

  it('starts in review when the routine has no exercises', () => {
    expect(start().phase).toBe('review')
  })
})

describe('completing sets', () => {
  it('logs each set, rests between them and ends in review', () => {
    const w = start(item('a'), item('b', { sets: 1, restSeconds: 30 }))
    const c1 = reduce(w, { type: 'completeSet', now: 1000 })
    expect(c1.phase).toBe('rest')
    expect(c1.cursor).toEqual({ exercise: 0, set: 1 })
    expect(c1.lastDone).toEqual({ exercise: 0, set: 0 })
    expect(c1.exercises[0].sets[0].actual).toBe(8)
    expect(remainingMs(c1.timer!, 1000)).toBe(60000)

    const c2 = run(
      c1,
      { type: 'endRest', now: 2000 },
      { type: 'completeSet', now: 3000 },
    )
    expect(c2.phase).toBe('rest')
    expect(c2.cursor).toEqual({ exercise: 1, set: 0 })

    const c3 = run(
      c2,
      { type: 'endRest', now: 4000 },
      { type: 'completeSet', now: 5000 },
    )
    expect(c3.phase).toBe('review')
    expect(c3.timer).toBeNull()
    expect(counts(c3)).toEqual({ done: 3, total: 3 })
  })

  it('goes straight to the next set when the rest is zero', () => {
    const w = start(item('a', { restSeconds: 0 }))
    const c = reduce(w, { type: 'completeSet', now: 1000 })
    expect(c.phase).toBe('set')
    expect(c.cursor).toEqual({ exercise: 0, set: 1 })
    expect(c.timer).toBeNull()
  })

  it('ignores a second tap on Done', () => {
    const once = reduce(start(item('a')), { type: 'completeSet', now: 1000 })
    expect(reduce(once, { type: 'completeSet', now: 1001 })).toBe(once)
  })

  it('completes a timed set only after its countdown ends', () => {
    const w = start(item('p', { targetType: 'seconds', target: 30, sets: 1 }))
    expect(reduce(w, { type: 'completeSet', now: 1000 })).toBe(w)
    const running = reduce(w, { type: 'startTimer', now: 1000 })
    expect(remainingMs(running.timer!, 1000)).toBe(30000)
    expect(reduce(running, { type: 'completeSet', now: 20000 })).toBe(running)
    const done = reduce(running, { type: 'completeSet', now: 31000 })
    expect(done.exercises[0].sets[0].actual).toBe(30)
    expect(done.phase).toBe('review')
  })
})

describe('adjusting the target', () => {
  it('logs the changed reps', () => {
    const c = run(
      start(item('a')),
      { type: 'adjustTarget', delta: 1, now: 500 },
      { type: 'completeSet', now: 1000 },
    )
    expect(c.exercises[0].sets[0].actual).toBe(9)
  })

  it('keeps reps between 1 and 100 and seconds between 5 and 600', () => {
    const reps = start(item('a'))
    expect(
      reduce(reps, { type: 'adjustTarget', delta: -999, now: 1 }).exercises[0]
        .sets[0].target,
    ).toBe(1)
    expect(
      reduce(reps, { type: 'adjustTarget', delta: 999, now: 1 }).exercises[0]
        .sets[0].target,
    ).toBe(100)
    const secs = start(item('p', { targetType: 'seconds', target: 30 }))
    expect(
      reduce(secs, { type: 'adjustTarget', delta: -999, now: 1 }).exercises[0]
        .sets[0].target,
    ).toBe(5)
    expect(
      reduce(secs, { type: 'adjustTarget', delta: 999, now: 1 }).exercises[0]
        .sets[0].target,
    ).toBe(600)
  })

  it('moves a running countdown by the same amount', () => {
    const c = run(
      start(item('p', { targetType: 'seconds', target: 30 })),
      { type: 'startTimer', now: 0 },
      { type: 'adjustTarget', delta: 15, now: 10000 },
    )
    expect(c.exercises[0].sets[0].target).toBe(45)
    expect(remainingMs(c.timer!, 10000)).toBe(35000)
  })

  it('is ignored during rest', () => {
    const rest = reduce(start(item('a')), { type: 'completeSet', now: 1 })
    expect(reduce(rest, { type: 'adjustTarget', delta: 1, now: 2 })).toBe(rest)
  })
})

describe('rest', () => {
  const rest = () =>
    reduce(start(item('a')), { type: 'completeSet', now: 1000 })

  it('can be extended and shortened, and remembers the change', () => {
    const longer = reduce(rest(), { type: 'adjustRest', delta: 15, now: 2000 })
    expect(remainingMs(longer.timer!, 2000)).toBe(74000)
    expect(longer.exercises[0].sets[0].restSeconds).toBe(75)
    const gone = reduce(rest(), { type: 'adjustRest', delta: -999, now: 2000 })
    expect(remainingMs(gone.timer!, 2000)).toBe(0)
    expect(gone.exercises[0].sets[0].restSeconds).toBe(0)
  })

  it('ends only while resting', () => {
    const w = start(item('a'))
    expect(reduce(w, { type: 'endRest', now: 1 })).toBe(w)
    const ended = reduce(rest(), { type: 'endRest', now: 2000 })
    expect(ended.phase).toBe('set')
    expect(ended.timer).toBeNull()
  })
})

describe('changing the plan', () => {
  it('adds a set as a copy of the last one, up to 10', () => {
    const w = start(item('a', { target: 12, restSeconds: 45 }))
    const c = reduce(w, { type: 'addSet', now: 1 })
    expect(c.exercises[0].sets).toHaveLength(3)
    expect(c.exercises[0].sets[2]).toEqual({
      target: 12,
      actual: null,
      restSeconds: 45,
    })
    const full = start(item('a', { sets: 10 }))
    expect(reduce(full, { type: 'addSet', now: 1 })).toBe(full)
  })

  it('reopens a finished workout when a set is added', () => {
    const review = reduce(start(item('a', { sets: 1 })), {
      type: 'completeSet',
      now: 1000,
    })
    expect(review.phase).toBe('review')
    const c = reduce(review, { type: 'addSet', now: 5000 })
    expect(c.phase).toBe('set')
    expect(c.cursor).toEqual({ exercise: 0, set: 1 })
    expect(c.exercises[0].sets[1].actual).toBeNull()
  })

  it('appends an exercise, clamping its sets, and refuses a 51st', () => {
    const w = start(item('a'))
    const c = reduce(w, {
      type: 'addExercise',
      item: item('z', { sets: 99, targetType: 'seconds', target: 30 }),
      uid: 'new',
      now: 1,
    })
    expect(c.exercises).toHaveLength(2)
    expect(c.exercises[1]).toMatchObject({
      uid: 'new',
      exerciseId: 'z',
      targetType: 'seconds',
      status: 'active',
    })
    expect(c.exercises[1].sets).toHaveLength(10)
    const full = start(...Array.from({ length: 50 }, (_, i) => item('e' + i)))
    expect(
      reduce(full, { type: 'addExercise', item: item('x'), uid: 'x', now: 1 }),
    ).toBe(full)
  })

  it('moves to an added exercise when the workout was in review', () => {
    const review = reduce(start(item('a', { sets: 1 })), {
      type: 'completeSet',
      now: 1000,
    })
    const c = reduce(review, {
      type: 'addExercise',
      item: item('z'),
      uid: 'new',
      now: 2000,
    })
    expect(c.phase).toBe('set')
    expect(c.cursor).toEqual({ exercise: 1, set: 0 })
  })

  it('removes the current exercise and moves on, ending in review at the last', () => {
    const w = start(item('a'), item('b'))
    const c = reduce(w, { type: 'removeExercise', uid: 'u1', now: 1 })
    expect(c.exercises[0].status).toBe('removed')
    expect(c.cursor).toEqual({ exercise: 1, set: 0 })
    expect(c.phase).toBe('set')
    const last = reduce(c, { type: 'removeExercise', uid: 'u2', now: 2 })
    expect(last.phase).toBe('review')
    expect(reduce(last, { type: 'removeExercise', uid: 'u2', now: 3 })).toBe(
      last,
    )
  })

  it('removes another exercise without moving the cursor', () => {
    const c = reduce(start(item('a'), item('b')), {
      type: 'removeExercise',
      uid: 'u2',
      now: 1,
    })
    expect(c.cursor).toEqual({ exercise: 0, set: 0 })
    expect(c.exercises[1].status).toBe('removed')
  })

  it('skips the current exercise but keeps the sets already done', () => {
    const resting = reduce(start(item('a'), item('b')), {
      type: 'completeSet',
      now: 1000,
    })
    const c = reduce(resting, { type: 'skipExercise', now: 2000 })
    expect(c.exercises[0].status).toBe('skipped')
    expect(c.exercises[0].sets[0].actual).toBe(8)
    expect(c.cursor).toEqual({ exercise: 1, set: 0 })
    expect(c.phase).toBe('set')
    expect(c.timer).toBeNull()
    expect(reduce(c, { type: 'skipExercise', now: 3000 }).phase).toBe('review')
  })
})

describe('pause', () => {
  const timed = () =>
    run(start(item('p', { targetType: 'seconds', target: 30 })), {
      type: 'startTimer',
      now: 0,
    })

  it('freezes the countdown and the clock, and resumes where it was', () => {
    const paused = reduce(timed(), { type: 'pause', now: 10000 })
    expect(paused.paused).toBe(true)
    expect(remainingMs(paused.timer!, 99999)).toBe(20000)
    expect(reduce(paused, { type: 'adjustTarget', delta: 1, now: 11000 })).toBe(
      paused,
    )
    expect(reduce(paused, { type: 'pause', now: 12000 })).toBe(paused)
    const resumed = reduce(paused, { type: 'resume', now: 70000 })
    expect(resumed.paused).toBe(false)
    expect(resumed.pausedMs).toBe(60000)
    expect(remainingMs(resumed.timer!, 70000)).toBe(20000)
  })
})

describe('finishing', () => {
  it('is completed only when every active set was done', () => {
    const all = run(
      start(item('a', { sets: 1 })),
      { type: 'completeSet', now: 1000 },
      { type: 'finish', note: '', now: 2000 },
    )
    expect(all.finish).toEqual({
      finishedAt: 2000,
      status: 'completed',
      note: '',
    })
    const some = reduce(start(item('a')), { type: 'finish', note: 'x', now: 5 })
    expect(some.finish?.status).toBe('partial')
  })

  it('counts nothing done as partial, and ignores a second finish', () => {
    const empty = reduce(start(), { type: 'finish', note: '', now: 5 })
    expect(empty.finish?.status).toBe('partial')
    expect(reduce(empty, { type: 'finish', note: 'again', now: 9 })).toBe(empty)
  })

  it('closes an open pause and stops the timer', () => {
    const c = run(
      start(item('p', { targetType: 'seconds', target: 30 })),
      { type: 'startTimer', now: 0 },
      { type: 'pause', now: 1000 },
      { type: 'finish', note: '', now: 6000 },
    )
    expect(c.paused).toBe(false)
    expect(c.pausedMs).toBe(5000)
    expect(c.timer).toBeNull()
  })
})

describe('selectors', () => {
  it('currentSet describes the set in play and is null in review', () => {
    const w = start(item('a'))
    const cur = currentSet(w)!
    expect(cur.exercise.exerciseId).toBe('a')
    expect(cur.setNumber).toBe(1)
    expect(cur.setCount).toBe(2)
    expect(cur.set.target).toBe(8)
    expect(currentSet(start())).toBeNull()
  })

  it('counts only sets of active exercises', () => {
    const w = run(
      start(item('a'), item('b')),
      { type: 'completeSet', now: 1 },
      { type: 'skipExercise', now: 2 },
    )
    expect(counts(w)).toEqual({ done: 0, total: 2 })
  })

  it('builds the saved payload for an early finish', () => {
    const w = run(
      start(item('a'), item('b')),
      { type: 'completeSet', now: 1000 },
      { type: 'pause', now: 100000 },
      { type: 'resume', now: 160000 },
      { type: 'finish', note: '  felt ok ', now: 600000 },
    )
    expect(toSessionPayload(w)).toEqual({
      id: 'w1',
      routineId: 'r1',
      routineName: 'Mine',
      startedAt: new Date(0).toISOString(),
      finishedAt: new Date(600000).toISOString(),
      durationSeconds: 540,
      status: 'partial',
      note: 'felt ok',
      log: [
        {
          exercise_id: 'a',
          target_type: 'reps',
          status: 'active',
          sets: [
            { target: 8, actual: 8, rest_seconds: 60 },
            { target: 8, actual: null, rest_seconds: 60 },
          ],
        },
        {
          exercise_id: 'b',
          target_type: 'reps',
          status: 'active',
          sets: [
            { target: 8, actual: null, rest_seconds: 60 },
            { target: 8, actual: null, rest_seconds: 60 },
          ],
        },
      ],
    })
  })

  it('turns a blank note into null and refuses an unfinished workout', () => {
    const done = reduce(start(item('a')), {
      type: 'finish',
      note: '  ',
      now: 5,
    })
    expect(toSessionPayload(done).note).toBeNull()
    expect(() => toSessionPayload(start(item('a')))).toThrow()
  })
})
