// @vitest-environment node
import {
  FED_SNAPSHOT,
  WG_MANIFEST,
  parseFreeExerciseDb,
  parseWorkoutGuide,
  readFreeExerciseDb,
  readWorkoutGuide,
} from './sources'

const attribution = {
  creator: 'Bryl Lim',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
}

const wgEntry = (id: string) => ({
  id,
  slug: id.replace('exercise-', ''),
  name: 'Push-up',
  exerciseType: 'bodyweight_reps',
  equipment: 'Bodyweight',
  primaryMuscle: 'Chest',
  secondaryMuscles: ['Triceps'],
  isStretch: false,
  frames: [
    {
      index: 1,
      path: 'assets/push-up/frame-1.png',
      width: 512,
      height: 512,
      format: 'png',
      attribution,
    },
  ],
})

it('parses Workout Guide entries', () => {
  const result = parseWorkoutGuide([
    wgEntry('exercise-a'),
    wgEntry('exercise-b'),
  ])
  expect(result.map((e) => e.id)).toEqual(['exercise-a', 'exercise-b'])
  expect(result[0].frames[0].attribution.creator).toBe('Bryl Lim')
})

it('throws naming the id when a Workout Guide entry has no frames', () => {
  const { frames: _frames, ...broken } = wgEntry('exercise-broken')
  expect(() => parseWorkoutGuide([broken])).toThrow(/exercise-broken/)
})

it('tolerates null equipment and empty instructions in free-exercise-db', () => {
  const result = parseFreeExerciseDb([
    {
      id: 'Some_Move',
      name: 'Some Move',
      force: null,
      level: 'beginner',
      mechanic: null,
      equipment: null,
      primaryMuscles: ['abdominals'],
      secondaryMuscles: [],
      instructions: [],
      category: 'strength',
      images: [],
    },
  ])
  expect(result[0].equipment).toBeNull()
  expect(result[0].instructions).toEqual([])
})

it('throws naming the id when a free-exercise-db entry is invalid', () => {
  expect(() => parseFreeExerciseDb([{ id: 'Bad_One', name: 5 }])).toThrow(
    /Bad_One/,
  )
})

it('reads the real vendored sources', () => {
  expect(readWorkoutGuide(WG_MANIFEST)).toHaveLength(302)
  expect(readFreeExerciseDb(FED_SNAPSHOT)).toHaveLength(876)
})
