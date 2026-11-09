// @vitest-environment node
import type { FedRaw, WgRaw } from './sources'
import { matchExercises, normalizeName } from './match'

const wg = (id: string, name: string, primaryMuscle = 'Chest'): WgRaw =>
  ({
    id,
    slug: id,
    name,
    exerciseType: 'bodyweight_reps',
    equipment: 'Bodyweight',
    primaryMuscle,
    secondaryMuscles: [],
    isStretch: false,
    frames: [],
  }) as unknown as WgRaw

const fed = (id: string, name: string, muscle = 'chest'): FedRaw => ({
  id,
  name,
  level: 'beginner',
  equipment: 'body only',
  primaryMuscles: [muscle],
  secondaryMuscles: [],
  instructions: [],
  category: 'strength',
  images: [],
})

it('normalizes case, accents and punctuation', () => {
  expect(normalizeName('Push-Up')).toBe('push up')
  expect(normalizeName('Café  Squats!')).toBe('cafe squat')
})

it('matches Push-up to Push-Up and Pushups exactly', () => {
  const result = matchExercises(
    [wg('wg-1', 'Push-up')],
    [fed('Push-Up', 'Push-Up')],
  )
  expect(result).toEqual([
    { wgId: 'wg-1', fedId: 'Push-Up', confidence: 'exact', score: 1 },
  ])
  const joined = matchExercises(
    [wg('wg-1', 'Push-up')],
    [fed('Pushups', 'Pushups')],
  )
  expect(joined[0]?.confidence).toBe('exact')
})

it('treats a plural last word as the same name', () => {
  const result = matchExercises(
    [wg('wg-1', 'Bodyweight Squat', 'Quads')],
    [fed('bs', 'Bodyweight Squats', 'quadriceps')],
  )
  expect(result[0]?.confidence).toBe('exact')
})

it('does not match Glute Bridge to Single-Leg Glute Bridge', () => {
  const result = matchExercises(
    [wg('wg-1', 'Glute Bridge', 'Glutes')],
    [fed('slgb', 'Single-Leg Glute Bridge', 'glutes')],
  )
  expect(result).toEqual([])
})

it('returns a fuzzy match when token sets agree and the primary muscle is the same', () => {
  const result = matchExercises(
    [wg('wg-1', 'Dumbbell Curl', 'Biceps')],
    [fed('cd', 'Curl Dumbbell', 'biceps')],
  )
  expect(result).toHaveLength(1)
  expect(result[0]).toMatchObject({ confidence: 'fuzzy', score: 1 })
})

it('drops a fuzzy candidate with a different primary muscle', () => {
  const result = matchExercises(
    [wg('wg-1', 'Curl Up', 'Chest')],
    [fed('uc', 'Up Curl', 'abdominals')],
  )
  expect(result).toEqual([])
})

it('never matches one free-exercise-db entry to two Workout Guide entries', () => {
  const result = matchExercises(
    [wg('wg-b', 'Push-up'), wg('wg-a', 'Push-up')],
    [fed('Push-Up', 'Push-Up')],
  )
  expect(result).toHaveLength(1)
  expect(result[0]?.wgId).toBe('wg-a')
})
