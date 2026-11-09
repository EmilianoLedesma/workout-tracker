import type { Exercise, Level } from '@/types/exercise'
import { isAvailable, isSuggested, type Equipment, type Muscle } from './vocab'

export type Filters = {
  query: string
  muscles: Muscle[]
  /** `'owned'` = only what the user can do with their equipment; `[]` = no equipment filter. */
  equipment: Equipment[] | 'owned'
  levels: Level[]
  suggestedOnly: boolean
}

export const normalizeSearch = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

function matchesQuery(ex: Exercise, query: string): boolean {
  const q = normalizeSearch(query)
  if (!q) return true
  const tokens = q.split(' ')
  const compact = q.replace(/ /g, '')
  return [ex.name, ...ex.aliases]
    .map(normalizeSearch)
    .some(
      (hay) =>
        tokens.every((t) => hay.includes(t)) ||
        hay.replace(/ /g, '').includes(compact),
    )
}

export function filterExercises(
  all: Exercise[],
  filters: Filters,
  owned: readonly Equipment[],
): Exercise[] {
  const { query, muscles, equipment, levels, suggestedOnly } = filters
  return all
    .filter((ex) => {
      if (ex.deprecated) return false
      if (!matchesQuery(ex, query)) return false
      if (
        muscles.length > 0 &&
        !(
          (ex.primaryMuscle !== null && muscles.includes(ex.primaryMuscle)) ||
          ex.secondaryMuscles.some((m) => muscles.includes(m))
        )
      ) {
        return false
      }
      if (equipment === 'owned') {
        if (!isAvailable(ex, owned)) return false
      } else if (
        equipment.length > 0 &&
        !ex.equipment.some((e) => equipment.includes(e))
      ) {
        return false
      }
      if (
        levels.length > 0 &&
        (ex.level === null || !levels.includes(ex.level))
      ) {
        return false
      }
      if (suggestedOnly && !isSuggested(ex)) return false
      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
}
