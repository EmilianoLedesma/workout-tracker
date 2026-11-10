import type { Exercise } from '@/types/exercise'
import type { RoutineExercise } from '@/types/routine'
import {
  addItem,
  defaultItem,
  draftFromRoutine,
  moveItem,
  removeItem,
  updateItem,
  validateDraft,
  type Draft,
} from './routineDraft'

const ex = (id: string, exerciseType: Exercise['exerciseType']) =>
  ({ id, exerciseType }) as Exercise

const item = (exerciseId: string): RoutineExercise => ({
  exerciseId,
  sets: 2,
  targetType: 'reps',
  target: 8,
  restSeconds: 60,
})

const draft = (...ids: string[]): Draft => ({
  name: 'Mine',
  dayLabel: null,
  items: ids.map(item),
})

describe('defaultItem', () => {
  it('uses 30 seconds for a timed exercise', () => {
    expect(defaultItem(ex('plank', 'duration'))).toEqual({
      exerciseId: 'plank',
      sets: 2,
      targetType: 'seconds',
      target: 30,
      restSeconds: 60,
    })
  })

  it('uses 8 reps for a reps exercise', () => {
    expect(defaultItem(ex('squat', 'reps'))).toMatchObject({
      targetType: 'reps',
      target: 8,
    })
  })

  it('uses reps when the exercise type is unknown', () => {
    expect(defaultItem(ex('mystery', 'unknown'))).toMatchObject({
      targetType: 'reps',
      target: 8,
    })
  })
})

describe('editing', () => {
  it('adds an item at the end without mutating the draft', () => {
    const before = draft('a')
    const after = addItem(before, ex('b', 'reps'))
    expect(after.items.map((i) => i.exerciseId)).toEqual(['a', 'b'])
    expect(before.items).toHaveLength(1)
  })

  it('removes an item and keeps the order of the rest', () => {
    expect(
      removeItem(draft('a', 'b', 'c'), 1).items.map((i) => i.exerciseId),
    ).toEqual(['a', 'c'])
  })

  it('moves an item up and down', () => {
    const d = draft('a', 'b', 'c')
    expect(moveItem(d, 1, -1).items.map((i) => i.exerciseId)).toEqual([
      'b',
      'a',
      'c',
    ])
    expect(moveItem(d, 1, 1).items.map((i) => i.exerciseId)).toEqual([
      'a',
      'c',
      'b',
    ])
  })

  it('does nothing when moving past either end', () => {
    const d = draft('a', 'b')
    expect(moveItem(d, 0, -1)).toEqual(d)
    expect(moveItem(d, 1, 1)).toEqual(d)
  })

  it('updates one item', () => {
    expect(updateItem(draft('a', 'b'), 1, { sets: 4 }).items[1].sets).toBe(4)
  })

  it('builds a draft from a routine', () => {
    expect(
      draftFromRoutine({
        id: 'r1',
        name: 'Full body',
        dayLabel: 'A',
        isStarter: true,
        items: [item('a')],
      }),
    ).toEqual({ name: 'Full body', dayLabel: 'A', items: [item('a')] })
  })
})

describe('validateDraft', () => {
  it('returns no errors for a valid draft, including one with no exercises', () => {
    expect(validateDraft(draft('a'))).toEqual({ items: {}, itemFields: {} })
    expect(validateDraft({ name: 'Empty', dayLabel: null, items: [] })).toEqual(
      { items: {}, itemFields: {} },
    )
  })

  it('requires a name that is not only whitespace', () => {
    expect(validateDraft({ ...draft('a'), name: '   ' }).name).toBe(
      'Name is required',
    )
  })

  it('rejects zero sets', () => {
    expect(validateDraft(updateItem(draft('a'), 0, { sets: 0 })).items[0]).toBe(
      'Sets must be 1 to 10',
    )
  })

  it('rejects reps that are not a number', () => {
    expect(
      validateDraft(updateItem(draft('a'), 0, { target: NaN })).items[0],
    ).toBe('Reps must be 1 to 100')
  })

  it('rejects 601 seconds', () => {
    const d = updateItem(draft('a'), 0, { targetType: 'seconds', target: 601 })
    expect(validateDraft(d).items[0]).toBe('Seconds must be 5 to 600')
  })

  it('rejects negative rest and reports the item by index', () => {
    const d = updateItem(draft('a', 'b'), 1, { restSeconds: -1 })
    expect(validateDraft(d).items).toEqual({ 1: 'Rest must be 0 to 600' })
  })

  it('reports which field of an item is wrong', () => {
    const field = (patch: Partial<RoutineExercise>) =>
      validateDraft(updateItem(draft('a'), 0, patch)).itemFields
    expect(field({ sets: 0 })).toEqual({ 0: 'sets' })
    expect(field({ target: 101 })).toEqual({ 0: 'target' })
    expect(field({ restSeconds: -1 })).toEqual({ 0: 'rest' })
  })
})
