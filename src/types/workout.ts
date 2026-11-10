import { z } from 'zod'

export const workoutSetSchema = z.object({
  target: z.number().int().min(1).max(600),
  actual: z.number().int().min(0).max(600).nullable(),
  restSeconds: z.number().int().min(0).max(600),
})
export type WorkoutSet = z.infer<typeof workoutSetSchema>

export const workoutExerciseSchema = z.object({
  uid: z.string().min(1),
  exerciseId: z.string().min(1).max(100),
  targetType: z.enum(['reps', 'seconds']),
  status: z.enum(['active', 'skipped', 'removed']),
  sets: z.array(workoutSetSchema).max(10),
})
export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>

/** A running timer has an absolute end; a paused one keeps what is left. */
export const timerSchema = z.union([
  z.object({ endsAt: z.number() }).strict(),
  z.object({ remainingMs: z.number().min(0) }).strict(),
])
export type Timer = z.infer<typeof timerSchema>

export const phaseSchema = z.enum(['set', 'rest', 'review'])
export type Phase = z.infer<typeof phaseSchema>

const position = z.object({
  exercise: z.number().int().min(0),
  set: z.number().int().min(0),
})

export const workoutSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  routineId: z.string().nullable(),
  routineName: z.string().min(1).max(60),
  startedAt: z.number(),
  updatedAt: z.number(),
  exercises: z.array(workoutExerciseSchema).max(50),
  cursor: position,
  phase: phaseSchema,
  timer: timerSchema.nullable(),
  lastDone: position.nullable(),
  /** When the last set was logged; guards against a double tap on Done. */
  lastCompletedAt: z.number().nullable().default(null),
  paused: z.boolean(),
  pausedAt: z.number().nullable(),
  pausedMs: z.number().min(0),
  finish: z
    .object({
      finishedAt: z.number(),
      status: z.enum(['completed', 'partial']),
      note: z.string().max(500),
    })
    .nullable(),
})
export type Workout = z.infer<typeof workoutSchema>
