import { z } from 'zod'
import { EQUIPMENT, MUSCLES } from '@/lib/catalog/vocab'

export const provenanceSchema = z.object({
  source: z.enum(['workout-guide', 'free-exercise-db', 'project']),
  sourceId: z.string().optional(),
  url: z.string().optional(),
  license: z.string(),
  author: z.string().optional(),
})
export type Provenance = z.infer<typeof provenanceSchema>

export const frameSchema = z.object({
  src: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  creator: z.string(),
  license: z.string(),
  licenseUrl: z.string(),
  sourceUrl: z.string().optional(),
  changes: z.string().optional(),
})
export type Frame = z.infer<typeof frameSchema>

export const levelSchema = z.enum(['beginner', 'intermediate', 'expert'])
export type Level = z.infer<typeof levelSchema>

export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  primaryMuscle: z.enum(MUSCLES).nullable(),
  secondaryMuscles: z.array(z.enum(MUSCLES)),
  equipment: z.array(z.enum(EQUIPMENT)),
  exerciseType: z.enum(['reps', 'duration', 'unknown']),
  level: levelSchema.nullable(),
  category: z.string().nullable(),
  isStretch: z.boolean(),
  description: z.string().nullable(),
  instructions: z.array(z.string()),
  frames: z.array(frameSchema),
  provenance: z.object({
    identity: provenanceSchema,
    muscles: provenanceSchema.nullable(),
    equipment: provenanceSchema.nullable(),
    level: provenanceSchema.nullable(),
    instructions: provenanceSchema.nullable(),
    frames: provenanceSchema.nullable(),
  }),
  reviewStatus: z.enum(['unreviewed', 'reviewed']),
  deprecated: z.boolean(),
  mergedFrom: z.array(z.string()),
})
export type Exercise = z.infer<typeof exerciseSchema>

export const catalogSchema = z.object({
  generatedAt: z.string(),
  exercises: z.array(exerciseSchema),
})
export type Catalog = z.infer<typeof catalogSchema>
