import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'

// scripts always run from the repo root (npm scripts, vitest)
const root = (rel: string) => resolve(process.cwd(), rel)

export const WG_MANIFEST = root(
  'node_modules/@bryllim/workout-guide/manifest.json',
)
export const FED_SNAPSHOT = root('data/sources/free-exercise-db.json')

const wgFrameSchema = z.object({
  index: z.number(),
  path: z.string(),
  width: z.number(),
  height: z.number(),
  format: z.string(),
  attribution: z.object({
    creator: z.string(),
    creatorUrl: z.string().optional(),
    license: z.string(),
    licenseUrl: z.string(),
    source: z
      .object({
        name: z.string(),
        url: z.string(),
        license: z.string(),
        licenseUrl: z.string(),
        changes: z.string().optional(),
      })
      .optional(),
  }),
})

const wgSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  exerciseType: z.string(),
  equipment: z.string(),
  primaryMuscle: z.string(),
  secondaryMuscles: z.array(z.string()),
  isStretch: z.boolean(),
  frames: z.array(wgFrameSchema).min(1),
})
export type WgRaw = z.infer<typeof wgSchema>

const fedSchema = z.object({
  id: z.string(),
  name: z.string(),
  force: z.string().nullable().optional(),
  level: z.string(),
  mechanic: z.string().nullable().optional(),
  equipment: z.string().nullable(),
  primaryMuscles: z.array(z.string()),
  secondaryMuscles: z.array(z.string()),
  instructions: z.array(z.string()).default([]),
  category: z.string(),
  images: z.array(z.string()).default([]),
})
export type FedRaw = z.infer<typeof fedSchema>

function parseEntries<T>(
  label: string,
  schema: z.ZodType<T>,
  data: unknown,
): T[] {
  if (!Array.isArray(data)) throw new Error(`${label}: expected an array`)
  return data.map((entry) => {
    const result = schema.safeParse(entry)
    if (result.success) return result.data
    const id = (entry as { id?: unknown })?.id
    throw new Error(
      `Invalid ${label} entry ${String(id)}: ${result.error.issues[0]?.message}`,
    )
  })
}

export const parseWorkoutGuide = (data: unknown) =>
  parseEntries('Workout Guide', wgSchema, data)
export const parseFreeExerciseDb = (data: unknown) =>
  parseEntries('free-exercise-db', fedSchema, data)

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, 'utf8'))

export const readWorkoutGuide = (manifestPath: string) =>
  parseWorkoutGuide(readJson(manifestPath))
export const readFreeExerciseDb = (jsonPath: string) =>
  parseFreeExerciseDb(readJson(jsonPath))
