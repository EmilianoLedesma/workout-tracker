import type { Exercise } from '@/types/exercise'
import { filterExercises, type Filters } from './search'

const ex = (over: Partial<Exercise> & { id: string; name: string }): Exercise =>
  ({
    aliases: [],
    primaryMuscle: null,
    secondaryMuscles: [],
    equipment: ['bodyweight'],
    level: null,
    deprecated: false,
    ...over,
  }) as Exercise

const none: Filters = {
  query: '',
  muscles: [],
  equipment: [],
  levels: [],
  suggestedOnly: false,
}

const names = (list: Exercise[]) => list.map((e) => e.name)

const catalog = [
  ex({ id: 'a', name: 'Push-up', primaryMuscle: 'chest', level: 'beginner' }),
  ex({ id: 'b', name: 'Café Squat', primaryMuscle: 'quads' }),
  ex({
    id: 'c',
    name: 'Wall Sit',
    primaryMuscle: 'quads',
    equipment: ['bodyweight', 'wall'],
    level: 'beginner',
  }),
  ex({
    id: 'd',
    name: 'Barbell Row',
    primaryMuscle: 'back',
    equipment: ['barbell'],
  }),
  ex({ id: 'e', name: 'Mystery Move', equipment: [], level: 'beginner' }),
  ex({ id: 'f', name: 'Old Move', deprecated: true }),
]

it('finds "Push-up" with the query "push up"', () => {
  expect(
    names(filterExercises(catalog, { ...none, query: 'push up' }, [])),
  ).toEqual(['Push-up'])
})

it('finds names regardless of accents and joined words', () => {
  expect(
    names(filterExercises(catalog, { ...none, query: 'cafe' }, [])),
  ).toEqual(['Café Squat'])
  expect(
    names(filterExercises(catalog, { ...none, query: 'pushup' }, [])),
  ).toEqual(['Push-up'])
})

it('matches aliases', () => {
  const withAlias = [
    ex({ id: 'z', name: 'Chair Stand', aliases: ['Sit to Stand'] }),
  ]
  expect(
    names(filterExercises(withAlias, { ...none, query: 'sit to stand' }, [])),
  ).toEqual(['Chair Stand'])
})

it('lists everything except deprecated for an empty query, sorted by name then id', () => {
  expect(names(filterExercises(catalog, none, []))).toEqual([
    'Barbell Row',
    'Café Squat',
    'Mystery Move',
    'Push-up',
    'Wall Sit',
  ])
})

it('filters by muscle', () => {
  expect(
    names(filterExercises(catalog, { ...none, muscles: ['quads'] }, [])),
  ).toEqual(['Café Squat', 'Wall Sit'])
})

it('owned equipment excludes exercises needing more and unknown equipment', () => {
  const result = filterExercises(catalog, { ...none, equipment: 'owned' }, [
    'bodyweight',
  ])
  expect(names(result)).toEqual(['Café Squat', 'Push-up'])
})

it('an explicit equipment list matches exercises needing any of those', () => {
  expect(
    names(filterExercises(catalog, { ...none, equipment: ['barbell'] }, [])),
  ).toEqual(['Barbell Row'])
})

it('suggestedOnly returns only beginner exercises with suggested equipment', () => {
  expect(
    names(filterExercises(catalog, { ...none, suggestedOnly: true }, [])),
  ).toEqual(['Push-up', 'Wall Sit'])
})

it('level filter drops exercises without a level', () => {
  expect(
    names(filterExercises(catalog, { ...none, levels: ['beginner'] }, [])),
  ).toEqual(['Mystery Move', 'Push-up', 'Wall Sit'])
})
