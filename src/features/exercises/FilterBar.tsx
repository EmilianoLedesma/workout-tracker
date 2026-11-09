import { label } from '@/lib/catalog/label'
import type { Filters } from '@/lib/catalog/search'
import { MUSCLES, type Muscle } from '@/lib/catalog/vocab'
import { levelSchema, type Level } from '@/types/exercise'

type Props = { filters: Filters; onChange: (next: Filters) => void }

const control = 'bg-background h-11 rounded-md border px-3'

export function FilterBar({ filters, onChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="exercise-search" className="text-sm font-medium">
          Search exercises
        </label>
        <input
          id="exercise-search"
          type="search"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          className={control}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-equipment" className="text-sm font-medium">
            Equipment
          </label>
          <select
            id="filter-equipment"
            className={control}
            value={filters.equipment === 'owned' ? 'owned' : 'all'}
            onChange={(e) =>
              set({ equipment: e.target.value === 'owned' ? 'owned' : [] })
            }
          >
            <option value="owned">My equipment</option>
            <option value="all">All equipment</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-muscle" className="text-sm font-medium">
            Muscle
          </label>
          <select
            id="filter-muscle"
            className={control}
            value={filters.muscles[0] ?? ''}
            onChange={(e) =>
              set({ muscles: e.target.value ? [e.target.value as Muscle] : [] })
            }
          >
            <option value="">All muscles</option>
            {MUSCLES.map((m) => (
              <option key={m} value={m}>
                {label(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-level" className="text-sm font-medium">
            Level
          </label>
          <select
            id="filter-level"
            className={control}
            value={filters.levels[0] ?? ''}
            onChange={(e) =>
              set({ levels: e.target.value ? [e.target.value as Level] : [] })
            }
          >
            <option value="">All levels</option>
            {levelSchema.options.map((l) => (
              <option key={l} value={l}>
                {label(l)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          className="size-5"
          checked={filters.suggestedOnly}
          onChange={(e) => set({ suggestedOnly: e.target.checked })}
        />
        <span>Suggested only (beginner, bodyweight, wall or chair)</span>
      </label>
    </div>
  )
}
