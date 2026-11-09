// @vitest-environment node
import { buildCatalog, type ProjectRaw } from './build'
import type { FedRaw, WgRaw } from './sources'

const attribution = {
  creator: 'Bryl Lim',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
}

const wg = (
  id: string,
  name: string,
  primaryMuscle = 'Chest',
  equipment = 'Bodyweight',
): WgRaw => ({
  id,
  slug: id.replace('exercise-', ''),
  name,
  exerciseType: 'bodyweight_reps',
  equipment,
  primaryMuscle,
  secondaryMuscles: ['Triceps'],
  isStretch: false,
  frames: [1, 2, 3].map((index) => ({
    index,
    path: `assets/${id}/frame-${index}.png`,
    width: 512,
    height: 512,
    format: 'png',
    attribution:
      index === 1
        ? {
            ...attribution,
            source: {
              name: 'Everkinetic',
              url: 'https://github.com/everkinetic/data',
              license: 'CC BY-SA 4.0',
              licenseUrl: attribution.licenseUrl,
              changes: 'Rasterized and recolored.',
            },
          }
        : attribution,
  })),
})

const fed = (id: string, name: string, over: Partial<FedRaw> = {}): FedRaw => ({
  id,
  name,
  level: 'beginner',
  equipment: 'body only',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  instructions: ['Do the move.'],
  category: 'strength',
  images: ['Some_Move/0.jpg'],
  ...over,
})

const project: ProjectRaw = {
  slug: 'chair-sit-to-stand',
  name: 'Chair Sit-to-Stand',
  aliases: [],
  primaryMuscle: 'quads',
  secondaryMuscles: ['glutes'],
  equipment: ['chair'],
  exerciseType: 'reps',
  isStretch: false,
  instructions: ['Sit, stand, sit.'],
}

const run = (w: WgRaw[], f: FedRaw[], p: unknown[] = []) =>
  buildCatalog({ wg: w, fed: f, project: p as ProjectRaw[], now: '2026-01-01' })

it('merges level and instructions for an exact match and records their source', () => {
  const { catalog } = run(
    [wg('exercise-push-up', 'Push-up')],
    [fed('Push-Up', 'Push-Up')],
  )
  const ex = catalog.exercises.find((e) => e.id === 'wg-push-up')!
  expect(ex.level).toBe('beginner')
  expect(ex.instructions).toEqual(['Do the move.'])
  expect(ex.provenance.level?.source).toBe('free-exercise-db')
  expect(ex.mergedFrom).toEqual([
    'workout-guide:exercise-push-up',
    'free-exercise-db:Push-Up',
  ])
  expect(catalog.exercises.some((e) => e.id === 'fed-push-up')).toBe(false)
})

it('merges nothing for a fuzzy match and lists it in the review', () => {
  const { catalog, review } = run(
    [wg('exercise-dumbbell-curl', 'Dumbbell Curl', 'Biceps', 'Dumbbell')],
    [
      fed('Curl_Dumbbell', 'Curl Dumbbell', {
        primaryMuscles: ['biceps'],
        equipment: 'dumbbell',
      }),
    ],
  )
  const ex = catalog.exercises.find((e) => e.id === 'wg-dumbbell-curl')!
  expect(ex.level).toBeNull()
  expect(ex.instructions).toEqual([])
  expect(review).toContain('Curl Dumbbell')
  expect(catalog.exercises.some((e) => e.id === 'fed-curl_dumbbell')).toBe(true)
})

it('leaves level and instructions empty for an unmatched Workout Guide exercise', () => {
  const { catalog } = run([wg('exercise-plank', 'Plank', 'Core')], [])
  const ex = catalog.exercises[0]
  expect(ex.level).toBeNull()
  expect(ex.instructions).toEqual([])
  expect(ex.provenance.level).toBeNull()
  expect(ex.provenance.instructions).toBeNull()
  expect(ex.frames).toHaveLength(3)
  expect(ex.frames[0].src).toBe('/exercises/wg/plank/frame-1.png')
})

it('makes text-only exercises from unmatched free-exercise-db entries without images', () => {
  const { catalog } = run([], [fed('Some_Move', 'Some Move')])
  const ex = catalog.exercises[0]
  expect(ex.id).toBe('fed-some_move')
  expect(ex.frames).toEqual([])
  expect(ex.provenance.frames).toBeNull()
  expect(ex.equipment).toEqual(['bodyweight'])
})

it('keeps equipment unknown when free-exercise-db has none', () => {
  const { catalog } = run([], [fed('Mystery', 'Mystery', { equipment: null })])
  expect(catalog.exercises[0].equipment).toEqual([])
})

it('adds project-authored exercises marked unreviewed', () => {
  const { catalog } = run([], [], [project])
  const ex = catalog.exercises[0]
  expect(ex.id).toBe('project-chair-sit-to-stand')
  expect(ex.reviewStatus).toBe('unreviewed')
  expect(ex.provenance.identity.source).toBe('project')
  expect(ex.level).toBeNull()
})

it('is deterministic and sorted by id', () => {
  const build = () =>
    run(
      [wg('exercise-b', 'B Move'), wg('exercise-a', 'A Move')],
      [fed('Z_Move', 'Z Move')],
      [project],
    )
  const first = build()
  expect(JSON.stringify(first)).toBe(JSON.stringify(build()))
  const ids = first.catalog.exercises.map((e) => e.id)
  expect(ids).toEqual([...ids].sort())
  expect(ids.every((id) => /^(wg|fed|project)-/.test(id))).toBe(true)
})

it('throws on an invalid project entry', () => {
  expect(() => run([], [], [{ slug: 'x' }])).toThrow()
})

it('builds credits with sources and frame attribution', () => {
  const { credits } = run([wg('exercise-plank', 'Plank', 'Core')], [])
  expect(credits.sources.map((s) => s.name)).toEqual(
    expect.arrayContaining([
      'Workout Guide',
      'Everkinetic',
      'free-exercise-db',
    ]),
  )
  expect(credits.frames[0]).toMatchObject({
    exerciseId: 'wg-plank',
    creator: 'Bryl Lim',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://github.com/everkinetic/data',
    changes: 'Rasterized and recolored.',
  })
})
