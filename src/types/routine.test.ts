import { DAY_LABELS, routineExerciseSchema, routineSchema } from './routine'

const item = {
  exerciseId: 'wg-plank',
  sets: 2,
  targetType: 'seconds',
  target: 20,
  restSeconds: 60,
}
const routine = {
  id: 'r1',
  name: 'Full body',
  dayLabel: 'A',
  isStarter: false,
  items: [item],
}

it('accepts a valid routine', () => {
  expect(routineSchema.safeParse(routine).success).toBe(true)
})

it('rejects zero sets', () => {
  expect(routineExerciseSchema.safeParse({ ...item, sets: 0 }).success).toBe(
    false,
  )
})

it('rejects a target above 600', () => {
  expect(
    routineExerciseSchema.safeParse({ ...item, target: 601 }).success,
  ).toBe(false)
})

it('rejects a blank name and an unknown day label', () => {
  expect(routineSchema.safeParse({ ...routine, name: '' }).success).toBe(false)
  expect(routineSchema.safeParse({ ...routine, dayLabel: 'Z' }).success).toBe(
    false,
  )
})

it('allows no day label', () => {
  expect(routineSchema.safeParse({ ...routine, dayLabel: null }).success).toBe(
    true,
  )
  expect(DAY_LABELS).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
})
