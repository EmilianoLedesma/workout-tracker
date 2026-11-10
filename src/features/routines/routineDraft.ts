import type { Exercise } from '@/types/exercise'
import type { DayLabel, Routine, RoutineExercise } from '@/types/routine'

export type Draft = {
  name: string
  dayLabel: DayLabel | null
  items: RoutineExercise[]
}

export type DraftErrors = { name?: string; items: Record<number, string> }

export function defaultItem(exercise: Exercise): RoutineExercise {
  const timed = exercise.exerciseType === 'duration'
  return {
    exerciseId: exercise.id,
    sets: 2,
    targetType: timed ? 'seconds' : 'reps',
    target: timed ? 30 : 8,
    restSeconds: 60,
  }
}

export const addItem = (d: Draft, ex: Exercise): Draft => ({
  ...d,
  items: [...d.items, defaultItem(ex)],
})

export const removeItem = (d: Draft, index: number): Draft => ({
  ...d,
  items: d.items.filter((_, i) => i !== index),
})

export function moveItem(d: Draft, index: number, direction: -1 | 1): Draft {
  const target = index + direction
  if (target < 0 || target >= d.items.length) return d
  const items = [...d.items]
  ;[items[index], items[target]] = [items[target], items[index]]
  return { ...d, items }
}

export const updateItem = (
  d: Draft,
  index: number,
  patch: Partial<RoutineExercise>,
): Draft => ({
  ...d,
  items: d.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
})

export const draftFromRoutine = (r: Routine): Draft => ({
  name: r.name,
  dayLabel: r.dayLabel,
  items: r.items,
})

const inRange = (n: number, min: number, max: number) =>
  Number.isInteger(n) && n >= min && n <= max

function itemError(item: RoutineExercise): string | undefined {
  if (!inRange(item.sets, 1, 10)) return 'Sets must be 1 to 10'
  if (item.targetType === 'reps' && !inRange(item.target, 1, 100)) {
    return 'Reps must be 1 to 100'
  }
  if (item.targetType === 'seconds' && !inRange(item.target, 5, 600)) {
    return 'Seconds must be 5 to 600'
  }
  if (!inRange(item.restSeconds, 0, 600)) return 'Rest must be 0 to 600'
}

export function validateDraft(d: Draft): DraftErrors {
  const errors: DraftErrors = { items: {} }
  const name = d.name.trim()
  if (!name) errors.name = 'Name is required'
  else if (name.length > 60) errors.name = 'Name must be 60 characters or fewer'
  d.items.forEach((item, i) => {
    const message = itemError(item)
    if (message) errors.items[i] = message
  })
  return errors
}
