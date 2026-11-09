import type { Exercise } from '@/types/exercise'
import {
  isAvailable,
  isCalisthenics,
  isSuggested,
  normalizeEquipment,
  normalizeMuscle,
} from './vocab'

const ex = (over: Partial<Exercise>): Exercise =>
  ({ equipment: [], level: null, ...over }) as Exercise

it('maps body only and Bodyweight to the same equipment', () => {
  expect(normalizeEquipment('body only')).toEqual(['bodyweight'])
  expect(normalizeEquipment('Bodyweight')).toEqual(['bodyweight'])
})

it('maps Wall to wall', () => {
  expect(normalizeEquipment('Wall')).toEqual(['wall'])
})

it('returns unknown equipment for null and unrecognized values', () => {
  expect(normalizeEquipment(null)).toEqual([])
  expect(normalizeEquipment('mystery')).toEqual([])
})

it('never treats unknown equipment as available', () => {
  expect(isAvailable({ equipment: [] }, ['bodyweight'])).toBe(false)
})

it('needs every required item to be owned', () => {
  const needsTwo: Exercise['equipment'] = ['bodyweight', 'wall']
  expect(isAvailable({ equipment: needsTwo }, ['bodyweight'])).toBe(false)
  expect(isAvailable({ equipment: needsTwo }, ['bodyweight', 'wall'])).toBe(
    true,
  )
})

it('suggests only beginner exercises with suggested equipment', () => {
  expect(isSuggested(ex({ equipment: ['bodyweight'], level: null }))).toBe(
    false,
  )
  expect(
    isSuggested(ex({ equipment: ['bodyweight'], level: 'beginner' })),
  ).toBe(true)
  expect(isSuggested(ex({ equipment: ['barbell'], level: 'beginner' }))).toBe(
    false,
  )
  expect(isSuggested(ex({ equipment: [], level: 'beginner' }))).toBe(false)
})

it('derives calisthenics from equipment only', () => {
  expect(isCalisthenics(ex({ equipment: ['bodyweight', 'wall'] }))).toBe(true)
  expect(isCalisthenics(ex({ equipment: ['dumbbell'] }))).toBe(false)
  expect(isCalisthenics(ex({ equipment: [] }))).toBe(false)
})

it('maps synonym muscles to one canonical muscle', () => {
  expect(normalizeMuscle('abdominals')).toBe(normalizeMuscle('Core'))
  expect(normalizeMuscle('quadriceps')).toBe(normalizeMuscle('Quads'))
  expect(normalizeMuscle('unheard of')).toBeNull()
})
