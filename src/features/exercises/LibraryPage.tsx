import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/features/settings/useSettings'
import { filterExercises, type Filters } from '@/lib/catalog/search'
import { ExerciseCard } from './ExerciseCard'
import { FilterBar } from './FilterBar'
import { useCatalog } from './useCatalog'

const PAGE_SIZE = 40

const DEFAULT_FILTERS: Filters = {
  query: '',
  muscles: [],
  equipment: 'owned',
  levels: [],
  suggestedOnly: false,
}
const CLEARED_FILTERS: Filters = { ...DEFAULT_FILTERS, equipment: [] }

export default function LibraryPage() {
  const catalog = useCatalog()
  const { settings } = useSettings()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const results = useMemo(
    () =>
      catalog.data
        ? filterExercises(catalog.data.exercises, filters, settings.equipment)
        : [],
    [catalog.data, filters, settings.equipment],
  )

  const change = (next: Filters) => {
    setFilters(next)
    setVisible(PAGE_SIZE)
  }

  let body
  if (catalog.isPending) {
    body = <p role="status">Loading exercises…</p>
  } else if (catalog.isError) {
    body = (
      <div role="alert" className="flex flex-col items-start gap-2">
        <p>Could not load the exercise library.</p>
        <Button className="h-11" onClick={() => catalog.refetch()}>
          Try again
        </Button>
      </div>
    )
  } else {
    body = (
      <>
        <FilterBar filters={filters} onChange={change} />
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {results.length} {results.length === 1 ? 'exercise' : 'exercises'}
        </p>
        {results.length === 0 ? (
          <div className="flex flex-col items-start gap-2">
            <p>No exercises match your filters.</p>
            <Button className="h-11" onClick={() => change(CLEARED_FILTERS)}>
              Clear filters
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {results.slice(0, visible).map((exercise) => (
              <li key={exercise.id}>
                <ExerciseCard exercise={exercise} />
              </li>
            ))}
          </ul>
        )}
        {visible < results.length && (
          <Button
            variant="outline"
            className="h-11"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            Show more
          </Button>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Library</h1>
      {body}
    </div>
  )
}
