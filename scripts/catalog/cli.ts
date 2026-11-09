import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { buildCatalog, type ProjectRaw } from './build'
import {
  FED_SNAPSHOT,
  WG_MANIFEST,
  readFreeExerciseDb,
  readWorkoutGuide,
} from './sources'

const root = (rel: string) => resolve(process.cwd(), rel)

const wg = readWorkoutGuide(WG_MANIFEST)
const fed = readFreeExerciseDb(FED_SNAPSHOT)
const project = JSON.parse(
  readFileSync(root('data/project-exercises.json'), 'utf8'),
) as ProjectRaw[]

const { catalog, credits, review } = buildCatalog({
  wg,
  fed,
  project,
  now: new Date().toISOString(),
})

const dataDir = root('src/data/exercise-catalog')
mkdirSync(dataDir, { recursive: true })
writeFileSync(resolve(dataDir, 'catalog.json'), JSON.stringify(catalog))
writeFileSync(resolve(dataDir, 'credits.json'), JSON.stringify(credits))
writeFileSync(resolve(dataDir, 'review-report.md'), review)

// Frames are copied unchanged: CC BY-SA 4.0 requires documenting any modification.
const packageRoot = dirname(WG_MANIFEST)
const outDir = root('public/exercises')
rmSync(resolve(outDir, 'wg'), { recursive: true, force: true })
let copied = 0
for (const w of wg) {
  const dest = resolve(outDir, 'wg', w.slug)
  mkdirSync(dest, { recursive: true })
  for (const frame of w.frames) {
    cpSync(
      resolve(packageRoot, frame.path),
      resolve(dest, `frame-${frame.index}.png`),
    )
    copied++
  }
}
writeFileSync(
  resolve(outDir, 'LICENSE.md'),
  [
    '# Exercise illustrations',
    '',
    'Frames in `wg/` come unchanged from the npm package `@bryllim/workout-guide`.',
    'Licensed under CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).',
    'Some frames derive from Everkinetic artwork, also CC BY-SA 4.0.',
    'Per-exercise creators and sources are listed in the app Credits screen.',
    '',
  ].join('\n'),
)

console.log(
  `catalog: ${catalog.exercises.length} exercises, ${copied} frames copied, ${credits.frames.length} credits`,
)
