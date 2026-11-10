import type { RoutineExercise, Routine } from '@/types/routine'
import type { Workout, WorkoutExercise, WorkoutSet } from '@/types/workout'
import {
  addSeconds,
  isFinished,
  pauseTimer,
  resumeTimer,
  startTimer,
} from './timer'

const MAX_SETS = 10
const MAX_EXERCISES = 50
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))

export type Action = (
  | { type: 'startTimer' }
  | { type: 'adjustTarget'; delta: number }
  | { type: 'completeSet' }
  | { type: 'adjustRest'; delta: number }
  | { type: 'endRest' }
  | { type: 'addSet' }
  | { type: 'addExercise'; item: RoutineExercise; uid: string }
  | { type: 'removeExercise'; uid: string }
  | { type: 'skipExercise' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'finish'; note: string }
) & { now: number }

/** Omit that keeps each member of a union separate, so `act` can drop `now`. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never

type Position = { exercise: number; set: number }

const toWorkoutExercise = (
  item: RoutineExercise,
  uid: string,
): WorkoutExercise => ({
  uid,
  exerciseId: item.exerciseId,
  targetType: item.targetType,
  status: 'active',
  sets: Array.from({ length: clamp(item.sets, 1, MAX_SETS) }, () => ({
    target: item.target,
    actual: null,
    restSeconds: item.restSeconds,
  })),
})

export function createWorkout(args: {
  id: string
  routine: Routine
  now: number
  uid: () => string
}): Workout {
  const exercises = args.routine.items.map((i) =>
    toWorkoutExercise(i, args.uid()),
  )
  return {
    version: 1,
    id: args.id,
    routineId: args.routine.id,
    routineName: args.routine.name,
    startedAt: args.now,
    updatedAt: args.now,
    exercises,
    cursor: { exercise: 0, set: 0 },
    phase: exercises.length ? 'set' : 'review',
    timer: null,
    lastDone: null,
    paused: false,
    pausedAt: null,
    pausedMs: 0,
    finish: null,
  }
}

/** The first set not done yet, after `from` (exclusive), in active exercises. */
function findNext(
  exercises: WorkoutExercise[],
  from: Position,
): Position | null {
  for (let e = from.exercise; e < exercises.length; e++) {
    const ex = exercises[e]
    if (ex.status !== 'active') continue
    const first = e === from.exercise ? from.set + 1 : 0
    for (let s = first; s < ex.sets.length; s++) {
      if (ex.sets[s].actual === null) return { exercise: e, set: s }
    }
  }
  return null
}

/** Moves on after an exercise is skipped or removed. */
function advanceFrom(w: Workout, exerciseIndex: number, now: number): Workout {
  const next = findNext(w.exercises, {
    exercise: exerciseIndex,
    set: Number.MAX_SAFE_INTEGER,
  })
  return next
    ? { ...w, cursor: next, phase: 'set', timer: null, updatedAt: now }
    : { ...w, phase: 'review', timer: null, updatedAt: now }
}

const replaceExercise = (
  exercises: WorkoutExercise[],
  index: number,
  patch: Partial<WorkoutExercise>,
) => exercises.map((e, i) => (i === index ? { ...e, ...patch } : e))

const replaceSet = (
  exercises: WorkoutExercise[],
  pos: Position,
  patch: Partial<WorkoutSet>,
) =>
  exercises.map((e, i) =>
    i === pos.exercise
      ? {
          ...e,
          sets: e.sets.map((s, j) => (j === pos.set ? { ...s, ...patch } : s)),
        }
      : e,
  )

const lastActiveIndex = (exercises: WorkoutExercise[]) => {
  for (let i = exercises.length - 1; i >= 0; i--) {
    if (exercises[i].status === 'active') return i
  }
  return -1
}

export function reduce(w: Workout, a: Action): Workout {
  if (w.finish) return w
  if (w.paused && a.type !== 'resume' && a.type !== 'finish') return w
  const { now } = a
  const cur = w.exercises[w.cursor.exercise]
  const curSet = cur?.sets[w.cursor.set]

  switch (a.type) {
    case 'startTimer': {
      if (w.phase !== 'set' || w.timer || !curSet) return w
      if (cur.status !== 'active' || cur.targetType !== 'seconds') return w
      if (curSet.actual !== null) return w
      return { ...w, timer: startTimer(now, curSet.target), updatedAt: now }
    }

    case 'adjustTarget': {
      if (w.phase !== 'set' || !curSet || cur.status !== 'active') return w
      if (curSet.actual !== null) return w
      const [min, max] = cur.targetType === 'seconds' ? [5, 600] : [1, 100]
      const target = clamp(curSet.target + a.delta, min, max)
      if (target === curSet.target) return w
      return {
        ...w,
        exercises: replaceSet(w.exercises, w.cursor, { target }),
        timer:
          w.timer && cur.targetType === 'seconds'
            ? addSeconds(w.timer, now, target - curSet.target)
            : w.timer,
        updatedAt: now,
      }
    }

    case 'completeSet': {
      if (w.phase !== 'set' || !curSet || cur.status !== 'active') return w
      if (curSet.actual !== null) return w
      if (
        cur.targetType === 'seconds' &&
        !(w.timer && isFinished(w.timer, now))
      ) {
        return w
      }
      const exercises = replaceSet(w.exercises, w.cursor, {
        actual: curSet.target,
      })
      const next = findNext(exercises, w.cursor)
      const base = {
        ...w,
        exercises,
        lastDone: w.cursor,
        timer: null,
        updatedAt: now,
      }
      if (!next) return { ...base, phase: 'review' }
      if (curSet.restSeconds > 0) {
        return {
          ...base,
          cursor: next,
          phase: 'rest',
          timer: startTimer(now, curSet.restSeconds),
        }
      }
      return { ...base, cursor: next, phase: 'set' }
    }

    case 'adjustRest': {
      if (w.phase !== 'rest' || !w.timer || !w.lastDone) return w
      const done = w.exercises[w.lastDone.exercise].sets[w.lastDone.set]
      return {
        ...w,
        timer: addSeconds(w.timer, now, a.delta),
        exercises: replaceSet(w.exercises, w.lastDone, {
          restSeconds: clamp(done.restSeconds + a.delta, 0, 600),
        }),
        updatedAt: now,
      }
    }

    case 'endRest':
      return w.phase === 'rest'
        ? { ...w, phase: 'set', timer: null, updatedAt: now }
        : w

    case 'addSet': {
      const index =
        w.phase === 'review' ? lastActiveIndex(w.exercises) : w.cursor.exercise
      const ex = w.exercises[index]
      if (!ex || ex.status !== 'active' || ex.sets.length >= MAX_SETS) return w
      const last = ex.sets[ex.sets.length - 1]
      const added: WorkoutSet = {
        target: last?.target ?? (ex.targetType === 'seconds' ? 30 : 8),
        actual: null,
        restSeconds: last?.restSeconds ?? 60,
      }
      const exercises = replaceExercise(w.exercises, index, {
        sets: [...ex.sets, added],
      })
      return w.phase === 'review'
        ? {
            ...w,
            exercises,
            cursor: { exercise: index, set: ex.sets.length },
            phase: 'set',
            updatedAt: now,
          }
        : { ...w, exercises, updatedAt: now }
    }

    case 'addExercise': {
      if (w.exercises.length >= MAX_EXERCISES) return w
      const exercises = [...w.exercises, toWorkoutExercise(a.item, a.uid)]
      return w.phase === 'review'
        ? {
            ...w,
            exercises,
            cursor: { exercise: exercises.length - 1, set: 0 },
            phase: 'set',
            updatedAt: now,
          }
        : { ...w, exercises, updatedAt: now }
    }

    case 'removeExercise':
    case 'skipExercise': {
      const index =
        a.type === 'removeExercise'
          ? w.exercises.findIndex((e) => e.uid === a.uid)
          : w.phase === 'review'
            ? -1
            : w.cursor.exercise
      const ex = w.exercises[index]
      if (!ex || ex.status !== 'active') return w
      const exercises = replaceExercise(w.exercises, index, {
        status: a.type === 'removeExercise' ? 'removed' : 'skipped',
      })
      const next = { ...w, exercises, updatedAt: now }
      const wasCurrent = w.phase !== 'review' && index === w.cursor.exercise
      return wasCurrent ? advanceFrom(next, index, now) : next
    }

    case 'pause':
      return {
        ...w,
        paused: true,
        pausedAt: now,
        timer: w.timer ? pauseTimer(w.timer, now) : null,
        updatedAt: now,
      }

    case 'resume': {
      if (!w.paused) return w
      return {
        ...w,
        paused: false,
        pausedAt: null,
        pausedMs: w.pausedMs + (now - (w.pausedAt ?? now)),
        timer: w.timer ? resumeTimer(w.timer, now) : null,
        updatedAt: now,
      }
    }

    case 'finish': {
      const { done, total } = counts(w)
      return {
        ...w,
        finish: {
          finishedAt: now,
          status: total > 0 && done === total ? 'completed' : 'partial',
          note: a.note,
        },
        paused: false,
        pausedAt: null,
        pausedMs: w.paused
          ? w.pausedMs + (now - (w.pausedAt ?? now))
          : w.pausedMs,
        timer: null,
        updatedAt: now,
      }
    }
  }
}

export function currentSet(w: Workout): {
  exercise: WorkoutExercise
  set: WorkoutSet
  setNumber: number
  setCount: number
} | null {
  if (w.phase === 'review') return null
  const exercise = w.exercises[w.cursor.exercise]
  const set = exercise?.sets[w.cursor.set]
  if (!exercise || !set) return null
  return {
    exercise,
    set,
    setNumber: w.cursor.set + 1,
    setCount: exercise.sets.length,
  }
}

export function counts(w: Workout): { done: number; total: number } {
  let done = 0
  let total = 0
  for (const e of w.exercises) {
    if (e.status !== 'active') continue
    for (const s of e.sets) {
      total++
      if (s.actual !== null) done++
    }
  }
  return { done, total }
}

type LogExercise = {
  exercise_id: string
  target_type: 'reps' | 'seconds'
  status: 'active' | 'skipped' | 'removed'
  sets: { target: number; actual: number | null; rest_seconds: number }[]
}

export type SessionPayload = {
  id: string
  routineId: string | null
  routineName: string
  startedAt: string
  finishedAt: string
  durationSeconds: number
  status: 'completed' | 'partial'
  note: string | null
  log: LogExercise[]
}

export function toSessionPayload(w: Workout): SessionPayload {
  if (!w.finish) throw new Error('Workout is not finished')
  const { finishedAt, status, note } = w.finish
  return {
    id: w.id,
    routineId: w.routineId,
    routineName: w.routineName,
    startedAt: new Date(w.startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    durationSeconds: Math.max(
      0,
      Math.round((finishedAt - w.startedAt - w.pausedMs) / 1000),
    ),
    status,
    note: note.trim() || null,
    log: w.exercises.map((e) => ({
      exercise_id: e.exerciseId,
      target_type: e.targetType,
      status: e.status,
      sets: e.sets.map((s) => ({
        target: s.target,
        actual: s.actual,
        rest_seconds: s.restSeconds,
      })),
    })),
  }
}
