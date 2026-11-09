import type { Exercise } from '@/types/exercise'

export const EQUIPMENT = [
  'bodyweight',
  'wall',
  'chair',
  'pull-up-bar',
  'doorway',
  'towel',
  'box',
  'bench',
  'dumbbell',
  'barbell',
  'kettlebell',
  'machine',
  'cable',
  'bands',
  'plate',
  'medicine-ball',
  'stability-ball',
  'foam-roll',
  'e-z-bar',
  'cardio-machine',
  'other',
] as const
export type Equipment = (typeof EQUIPMENT)[number]

// Union of Workout Guide and free-exercise-db muscle names, merged by synonym:
// abdominals/Core -> core, quadriceps/Quads -> quads, middle back -> upper-back,
// Groin -> adductors, Grip -> forearms. Generic Workout Guide groups (Back, Legs,
// Posterior Chain, Mobility, Cardio) stay as their own values.
export const MUSCLES = [
  'chest',
  'shoulders',
  'rear-delts',
  'biceps',
  'triceps',
  'forearms',
  'upper-back',
  'lats',
  'lower-back',
  'back',
  'core',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
  'adductors',
  'abductors',
  'hips',
  'neck',
  'traps',
  'legs',
  'posterior-chain',
  'mobility',
  'cardio',
] as const
export type Muscle = (typeof MUSCLES)[number]

const EQUIPMENT_MAP: Record<string, Equipment> = {
  bodyweight: 'bodyweight',
  'body only': 'bodyweight',
  wall: 'wall',
  chair: 'chair',
  'pull-up bar': 'pull-up-bar',
  doorway: 'doorway',
  towel: 'towel',
  box: 'box',
  bench: 'bench',
  dumbbell: 'dumbbell',
  barbell: 'barbell',
  kettlebell: 'kettlebell',
  kettlebells: 'kettlebell',
  machine: 'machine',
  cable: 'cable',
  'resistance band': 'bands',
  bands: 'bands',
  plate: 'plate',
  'medicine ball': 'medicine-ball',
  'stability ball': 'stability-ball',
  'exercise ball': 'stability-ball',
  'foam roll': 'foam-roll',
  'e-z curl bar': 'e-z-bar',
  cardio: 'cardio-machine',
  other: 'other',
}

const MUSCLE_MAP: Record<string, Muscle> = {
  chest: 'chest',
  shoulders: 'shoulders',
  'rear delts': 'rear-delts',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  grip: 'forearms',
  'upper back': 'upper-back',
  'middle back': 'upper-back',
  lats: 'lats',
  'lower back': 'lower-back',
  back: 'back',
  core: 'core',
  abdominals: 'core',
  glutes: 'glutes',
  quads: 'quads',
  quadriceps: 'quads',
  hamstrings: 'hamstrings',
  calves: 'calves',
  adductors: 'adductors',
  groin: 'adductors',
  abductors: 'abductors',
  hips: 'hips',
  neck: 'neck',
  traps: 'traps',
  legs: 'legs',
  'posterior chain': 'posterior-chain',
  mobility: 'mobility',
  cardio: 'cardio',
}

export function normalizeEquipment(
  raw: string | null | undefined,
): Equipment[] {
  if (!raw) return []
  const mapped = EQUIPMENT_MAP[raw.trim().toLowerCase()]
  return mapped ? [mapped] : []
}

export function normalizeMuscle(raw: string): Muscle | null {
  return MUSCLE_MAP[raw.trim().toLowerCase()] ?? null
}

export const SUGGESTED_EQUIPMENT: readonly Equipment[] = [
  'bodyweight',
  'wall',
  'chair',
]

const CALISTHENICS_EQUIPMENT: readonly Equipment[] = [
  'bodyweight',
  'wall',
  'chair',
  'pull-up-bar',
  'doorway',
]

const subsetOf = (items: readonly Equipment[], allowed: readonly Equipment[]) =>
  items.length > 0 && items.every((item) => allowed.includes(item))

/** Unknown equipment ([]) is never available. */
export function isAvailable(
  ex: Pick<Exercise, 'equipment'>,
  owned: readonly Equipment[],
): boolean {
  return subsetOf(ex.equipment, owned)
}

/** Suggested = suggested equipment only AND a source states beginner. */
export function isSuggested(ex: Exercise): boolean {
  return ex.level === 'beginner' && subsetOf(ex.equipment, SUGGESTED_EQUIPMENT)
}

/** Derived label, not a source field. */
export function isCalisthenics(ex: Exercise): boolean {
  return subsetOf(ex.equipment, CALISTHENICS_EQUIPMENT)
}
