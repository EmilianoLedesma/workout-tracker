import { exerciseSchema } from './exercise'

const provenance = { source: 'project', license: 'project' } as const

const valid = {
  id: 'project-x',
  name: 'X',
  aliases: [],
  primaryMuscle: null,
  secondaryMuscles: [],
  equipment: [],
  exerciseType: 'unknown',
  level: null,
  category: null,
  isStretch: false,
  description: null,
  instructions: [],
  frames: [],
  provenance: {
    identity: provenance,
    muscles: null,
    equipment: null,
    level: null,
    instructions: null,
    frames: null,
  },
  reviewStatus: 'unreviewed',
  deprecated: false,
  mergedFrom: [],
}

it('accepts a minimal valid exercise', () => {
  expect(exerciseSchema.safeParse(valid).success).toBe(true)
})

it('rejects an exercise whose identity provenance is missing', () => {
  const bad = { ...valid, provenance: { ...valid.provenance, identity: null } }
  expect(exerciseSchema.safeParse(bad).success).toBe(false)
})
