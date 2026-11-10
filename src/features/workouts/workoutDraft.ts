import { workoutSchema, type Workout } from '@/types/workout'

export const DRAFT_KEY = 'workout-draft-v1'
export const STALE_MS = 24 * 60 * 60 * 1000

// Storage can be missing, full or blocked (private windows): never let that
// break a workout.
const defaultStorage = (): Storage | undefined => {
  try {
    return localStorage
  } catch {
    return undefined
  }
}

export function loadDraft(storage = defaultStorage()): Workout | null {
  try {
    const raw = storage?.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = workoutSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function saveDraft(w: Workout, storage = defaultStorage()): void {
  try {
    storage?.setItem(DRAFT_KEY, JSON.stringify(w))
  } catch {
    // Out of space or blocked: the workout still runs from memory.
  }
}

export function clearDraft(storage = defaultStorage()): void {
  try {
    storage?.removeItem(DRAFT_KEY)
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}

export const isStale = (w: Workout, now: number): boolean =>
  now - w.updatedAt > STALE_MS
