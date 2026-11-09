import { normalizeMuscle } from '../../src/lib/catalog/vocab'
import type { FedRaw, WgRaw } from './sources'

export type Match = {
  wgId: string
  fedId: string
  confidence: 'exact' | 'fuzzy'
  score: number
}

const FUZZY_THRESHOLD = 0.85

/** Lowercase, no accents or punctuation, single spaces, plural last word singularized. */
export function normalizeName(name: string): string {
  const words = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
  const last = words.length - 1
  if (last >= 0) {
    const word = words[last]
    if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) {
      words[last] = word.slice(0, -1)
    }
  }
  return words.join(' ')
}

const nameKey = (name: string) => normalizeName(name).replace(/ /g, '')

function jaccard(a: string, b: string): number {
  const x = new Set(normalizeName(a).split(' '))
  const y = new Set(normalizeName(b).split(' '))
  const shared = [...x].filter((t) => y.has(t)).length
  return shared / (x.size + y.size - shared)
}

const byId = <T extends { id: string }>(a: T, b: T) => a.id.localeCompare(b.id)

/** Each side matches at most once. Output is deterministic and sorted by wgId. */
export function matchExercises(wg: WgRaw[], fed: FedRaw[]): Match[] {
  const matches: Match[] = []
  const usedWg = new Set<string>()
  const usedFed = new Set<string>()
  const take = (m: Match) => {
    matches.push(m)
    usedWg.add(m.wgId)
    usedFed.add(m.fedId)
  }

  const fedByKey = new Map<string, FedRaw[]>()
  for (const f of [...fed].sort(byId)) {
    const key = nameKey(f.name)
    fedByKey.set(key, [...(fedByKey.get(key) ?? []), f])
  }
  for (const w of [...wg].sort(byId)) {
    const candidate = fedByKey
      .get(nameKey(w.name))
      ?.find((f) => !usedFed.has(f.id))
    if (candidate) {
      take({ wgId: w.id, fedId: candidate.id, confidence: 'exact', score: 1 })
    }
  }

  const pairs: Match[] = []
  for (const w of wg) {
    if (usedWg.has(w.id)) continue
    const wMuscle = normalizeMuscle(w.primaryMuscle)
    if (!wMuscle) continue
    for (const f of fed) {
      if (usedFed.has(f.id)) continue
      if (normalizeMuscle(f.primaryMuscles[0] ?? '') !== wMuscle) continue
      const score = jaccard(w.name, f.name)
      if (score >= FUZZY_THRESHOLD) {
        pairs.push({ wgId: w.id, fedId: f.id, confidence: 'fuzzy', score })
      }
    }
  }
  pairs.sort(
    (a, b) =>
      b.score - a.score ||
      a.wgId.localeCompare(b.wgId) ||
      a.fedId.localeCompare(b.fedId),
  )
  for (const pair of pairs) {
    if (!usedWg.has(pair.wgId) && !usedFed.has(pair.fedId)) take(pair)
  }

  return matches.sort((a, b) => a.wgId.localeCompare(b.wgId))
}
