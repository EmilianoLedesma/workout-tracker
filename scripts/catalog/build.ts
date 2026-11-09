import { z } from 'zod'
import {
  EQUIPMENT,
  MUSCLES,
  normalizeEquipment,
  normalizeMuscle,
  type Muscle,
} from '../../src/lib/catalog/vocab'
import type { Credits } from '../../src/types/credits'
import {
  catalogSchema,
  levelSchema,
  type Catalog,
  type Exercise,
  type Frame,
  type Provenance,
} from '../../src/types/exercise'
import { matchExercises } from './match'
import type { FedRaw, WgRaw } from './sources'

export const projectSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  primaryMuscle: z.enum(MUSCLES).nullable(),
  secondaryMuscles: z.array(z.enum(MUSCLES)),
  equipment: z.array(z.enum(EQUIPMENT)),
  exerciseType: z.enum(['reps', 'duration']),
  isStretch: z.boolean(),
  instructions: z.array(z.string()),
})
export type ProjectRaw = z.infer<typeof projectSchema>

export type BuildInput = {
  wg: WgRaw[]
  fed: FedRaw[]
  project: ProjectRaw[]
  now: string
}
export type BuildOutput = { catalog: Catalog; credits: Credits; review: string }

const WG_URL = 'https://github.com/bryllim/workout-guide'
const FED_URL = 'https://github.com/yuhonas/free-exercise-db'

const wgProvenance = (id: string): Provenance => ({
  source: 'workout-guide',
  sourceId: id,
  url: WG_URL,
  license: 'MIT',
  author: 'Bryl Lim',
})
const wgFrameProvenance = (id: string): Provenance => ({
  ...wgProvenance(id),
  license: 'CC BY-SA 4.0',
})
const fedProvenance = (id: string): Provenance => ({
  source: 'free-exercise-db',
  sourceId: id,
  url: FED_URL,
  license: 'Unlicense',
})
const projectProvenance = (slug: string): Provenance => ({
  source: 'project',
  sourceId: slug,
  license: 'MIT (this project)',
  author: 'Workout Tracker project',
})

const muscles = (raw: (string | undefined)[], exclude: Muscle | null) => {
  const found = raw
    .map((m) => (m ? normalizeMuscle(m) : null))
    .filter((m): m is Muscle => m !== null && m !== exclude)
  return [...new Set(found)]
}

const wgType = (t: string): Exercise['exerciseType'] =>
  t === 'duration' || t === 'distance_duration'
    ? 'duration'
    : t === 'bodyweight_reps' ||
        t === 'weight_reps' ||
        t === 'assisted_bodyweight'
      ? 'reps'
      : 'unknown'

const fedLevel = (level: string) => levelSchema.safeParse(level).data ?? null

function wgExercise(w: WgRaw, merged: FedRaw | undefined): Exercise {
  const primaryMuscle = normalizeMuscle(w.primaryMuscle)
  const frames: Frame[] = w.frames.map((f) => ({
    src: `/exercises/wg/${w.slug}/frame-${f.index}.png`,
    width: f.width,
    height: f.height,
    creator: f.attribution.creator,
    license: f.attribution.license,
    licenseUrl: f.attribution.licenseUrl,
    ...(f.attribution.source && { sourceUrl: f.attribution.source.url }),
    ...(f.attribution.source?.changes && {
      changes: f.attribution.source.changes,
    }),
  }))
  return {
    id: `wg-${w.slug}`,
    name: w.name,
    aliases: merged && merged.name !== w.name ? [merged.name] : [],
    primaryMuscle,
    secondaryMuscles: muscles(w.secondaryMuscles, primaryMuscle),
    equipment: normalizeEquipment(w.equipment),
    exerciseType: wgType(w.exerciseType),
    level: merged ? fedLevel(merged.level) : null,
    category: merged ? merged.category : null,
    isStretch: w.isStretch,
    description: null,
    instructions: merged ? merged.instructions : [],
    frames,
    provenance: {
      identity: wgProvenance(w.id),
      muscles: wgProvenance(w.id),
      equipment: wgProvenance(w.id),
      level: merged ? fedProvenance(merged.id) : null,
      instructions:
        merged && merged.instructions.length ? fedProvenance(merged.id) : null,
      frames: wgFrameProvenance(w.id),
    },
    reviewStatus: 'unreviewed',
    deprecated: false,
    mergedFrom: merged
      ? [`workout-guide:${w.id}`, `free-exercise-db:${merged.id}`]
      : [`workout-guide:${w.id}`],
  }
}

function fedExercise(f: FedRaw): Exercise {
  const primaryMuscle = normalizeMuscle(f.primaryMuscles[0] ?? '')
  return {
    id: `fed-${f.id.toLowerCase()}`,
    name: f.name,
    aliases: [],
    primaryMuscle,
    secondaryMuscles: muscles(
      [...f.primaryMuscles.slice(1), ...f.secondaryMuscles],
      primaryMuscle,
    ),
    equipment: normalizeEquipment(f.equipment),
    exerciseType: 'unknown',
    level: fedLevel(f.level),
    category: f.category,
    isStretch: f.category === 'stretching',
    description: null,
    instructions: f.instructions,
    frames: [],
    provenance: {
      identity: fedProvenance(f.id),
      muscles: fedProvenance(f.id),
      equipment: f.equipment ? fedProvenance(f.id) : null,
      level: fedProvenance(f.id),
      instructions: f.instructions.length ? fedProvenance(f.id) : null,
      frames: null,
    },
    reviewStatus: 'unreviewed',
    deprecated: false,
    mergedFrom: [`free-exercise-db:${f.id}`],
  }
}

function projectExercise(p: ProjectRaw): Exercise {
  const provenance = projectProvenance(p.slug)
  return {
    id: `project-${p.slug}`,
    name: p.name,
    aliases: p.aliases,
    primaryMuscle: p.primaryMuscle,
    secondaryMuscles: p.secondaryMuscles,
    equipment: p.equipment,
    exerciseType: p.exerciseType,
    level: null,
    category: null,
    isStretch: p.isStretch,
    description: null,
    instructions: p.instructions,
    frames: [],
    provenance: {
      identity: provenance,
      muscles: provenance,
      equipment: provenance,
      level: null,
      instructions: p.instructions.length ? provenance : null,
      frames: null,
    },
    reviewStatus: 'unreviewed',
    deprecated: false,
    mergedFrom: [`project:${p.slug}`],
  }
}

const SOURCES: Credits['sources'] = [
  {
    name: 'Workout Guide',
    url: WG_URL,
    license: 'Code MIT, illustrations CC BY-SA 4.0',
    note: 'Exercise metadata and three-frame illustrations by Bryl Lim.',
  },
  {
    name: 'Everkinetic',
    url: 'https://github.com/everkinetic/data',
    license: 'CC BY-SA 4.0',
    note: 'Original artwork behind some Workout Guide frames, rasterized and recolored.',
  },
  {
    name: 'free-exercise-db',
    url: FED_URL,
    license: 'Unlicense (maintainer statement)',
    note: 'Instructions, level, category and text-only exercises. Its images are not used.',
  },
  {
    name: 'Workout Tracker project',
    url: 'https://github.com/EmilianoLedesma/workout-tracker',
    license: 'MIT',
    note: 'Exercises written by this project are marked project-authored and unreviewed.',
  },
]

function buildReview(
  input: BuildInput,
  exercises: Exercise[],
  fuzzy: { w: WgRaw; f: FedRaw; score: number }[],
  exactCount: number,
): string {
  const withoutLevel = exercises.filter(
    (e) => e.id.startsWith('wg-') && e.level === null,
  )
  const lines = [
    '# Catalog import review',
    '',
    `- Workout Guide exercises: ${input.wg.length} (${exactCount} merged with free-exercise-db by exact name, ${withoutLevel.length} without level or instructions)`,
    `- free-exercise-db entries: ${input.fed.length} (${input.fed.length - exactCount} kept as text-only exercises)`,
    `- Project-authored exercises: ${input.project.length} (unreviewed)`,
    '',
    '## Fuzzy matches (not merged, review by hand)',
    '',
    ...(fuzzy.length
      ? fuzzy.map(
          (m) => `- ${m.w.name} <-> ${m.f.name} (score ${m.score.toFixed(2)})`,
        )
      : ['- none']),
    '',
  ]
  return lines.join('\n')
}

/** Pure and deterministic: same input, same output, sorted by id. */
export function buildCatalog(input: BuildInput): BuildOutput {
  const project = input.project.map((p) => projectSchema.parse(p))
  const matches = matchExercises(input.wg, input.fed)
  const exact = matches.filter((m) => m.confidence === 'exact')
  const fedById = new Map(input.fed.map((f) => [f.id, f]))
  const wgById = new Map(input.wg.map((w) => [w.id, w]))
  const mergedFedByWg = new Map(
    exact.map((m) => [m.wgId, fedById.get(m.fedId)!]),
  )
  const mergedFedIds = new Set(exact.map((m) => m.fedId))

  const exercises = [
    ...input.wg.map((w) => wgExercise(w, mergedFedByWg.get(w.id))),
    ...input.fed.filter((f) => !mergedFedIds.has(f.id)).map(fedExercise),
    ...project.map(projectExercise),
  ].sort((a, b) => a.id.localeCompare(b.id))

  const catalog = catalogSchema.parse({ generatedAt: input.now, exercises })

  const frames: Credits['frames'] = [...input.wg]
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((w) => {
      const framed = w.frames.find((f) => f.attribution.source) ?? w.frames[0]
      const { attribution } = framed
      return {
        exerciseId: `wg-${w.slug}`,
        creator: attribution.creator,
        license: attribution.license,
        licenseUrl: attribution.licenseUrl,
        ...(attribution.source && { sourceUrl: attribution.source.url }),
        ...(attribution.source?.changes && {
          changes: attribution.source.changes,
        }),
      }
    })

  const fuzzy = matches
    .filter((m) => m.confidence === 'fuzzy')
    .map((m) => ({
      w: wgById.get(m.wgId)!,
      f: fedById.get(m.fedId)!,
      score: m.score,
    }))

  return {
    catalog,
    credits: { sources: SOURCES, frames },
    review: buildReview(input, catalog.exercises, fuzzy, exact.length),
  }
}
