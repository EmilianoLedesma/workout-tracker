import { routineExerciseSchema } from '@/types/routine'
import { STARTER_ROUTINES } from './starters'

const DURATION_IDS = [
  'wg-plank',
  'wg-wall-sit',
  'wg-childs-pose',
  'wg-cat-cow-stretch',
  'wg-arm-circles',
  'wg-wall-calf-stretch',
]

it('has three starters labelled A, B and C', () => {
  expect(STARTER_ROUTINES.map((r) => r.dayLabel)).toEqual(['A', 'B', 'C'])
})

it.each(STARTER_ROUTINES)('$name has 5 to 6 valid items', ({ items }) => {
  expect(items.length).toBeGreaterThanOrEqual(5)
  expect(items.length).toBeLessThanOrEqual(6)
  for (const item of items) {
    expect(routineExerciseSchema.safeParse(item).success).toBe(true)
  }
})

it.each(STARTER_ROUTINES)('$name repeats no exercise', ({ items }) => {
  const ids = items.map((i) => i.exerciseId)
  expect(new Set(ids).size).toBe(ids.length)
})

it('uses seconds only for timed exercises', () => {
  for (const { items } of STARTER_ROUTINES) {
    for (const item of items) {
      expect(item.targetType === 'seconds').toBe(
        DURATION_IDS.includes(item.exerciseId),
      )
    }
  }
})
