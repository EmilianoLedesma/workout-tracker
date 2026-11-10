import type { Exercise } from '@/types/exercise'
import type { DayLabel, Routine, RoutineExercise } from '@/types/routine'

export type Draft = {
  name: string
  dayLabel: DayLabel | null
  items: RoutineExercise[]
}

export type ItemField = 'sets' | 'target' | 'rest'
export type DraftErrors = {
  name?: string
  /** Problem with the list as a whole, such as too many exercises. */
  limit?: string
  items: Record<number, string>
  /** Which input of an item is wrong, so the editor can mark and focus it. */
  itemFields: Record<number, ItemField>
}

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

// Matches the check in save_routine (migration 0004).
const MAX_ITEMS = 50

const inRange = (n: number, min: number, max: number) =>
  Number.isInteger(n) && n >= min && n <= max

function itemError(
  item: RoutineExercise,
): { field: ItemField; message: string } | undefined {
  if (!inRange(item.sets, 1, 10)) {
    return { field: 'sets', message: 'Sets must be 1 to 10' }
  }
  if (item.targetType === 'reps' && !inRange(item.target, 1, 100)) {
    return { field: 'target', message: 'Reps must be 1 to 100' }
  }
  if (item.targetType === 'seconds' && !inRange(item.target, 5, 600)) {
    return { field: 'target', message: 'Seconds must be 5 to 600' }
  }
  if (!inRange(item.restSeconds, 0, 600)) {
    return { field: 'rest', message: 'Rest must be 0 to 600' }
  }
}

export function validateDraft(d: Draft): DraftErrors {
  const errors: DraftErrors = { items: {}, itemFields: {} }
  const name = d.name.trim()
  if (!name) errors.name = 'Name is required'
  else if (name.length > 60) errors.name = 'Name must be 60 characters or fewer'
  if (d.items.length > MAX_ITEMS) {
    errors.limit = `A routine can have at most ${MAX_ITEMS} exercises`
  }
  d.items.forEach((item, i) => {
    const found = itemError(item)
    if (found) {
      errors.items[i] = found.message
      errors.itemFields[i] = found.field
    }
  })
  return errors
}
