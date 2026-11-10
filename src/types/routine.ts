import { z } from 'zod'

export const DAY_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const
export type DayLabel = (typeof DAY_LABELS)[number]

export const routineExerciseSchema = z.object({
  exerciseId: z.string().min(1).max(100),
  sets: z.number().int().min(1).max(10),
  targetType: z.enum(['reps', 'seconds']),
  target: z.number().int().min(1).max(600),
  restSeconds: z.number().int().min(0).max(600),
})
export type RoutineExercise = z.infer<typeof routineExerciseSchema>

export const routineSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(60),
  dayLabel: z.enum(DAY_LABELS).nullable(),
  isStarter: z.boolean(),
  items: z.array(routineExerciseSchema),
})
export type Routine = z.infer<typeof routineSchema>
