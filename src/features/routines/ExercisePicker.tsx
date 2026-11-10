import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { label } from '@/lib/catalog/label'
import { filterExercises } from '@/lib/catalog/search'
import type { Equipment } from '@/lib/catalog/vocab'
import type { Exercise } from '@/types/exercise'

const MAX_RESULTS = 20

type Props = {
  exercises: Exercise[]
  equipment: readonly Equipment[]
  onAdd: (exercise: Exercise) => void
}

export function ExercisePicker({ exercises, equipment, onAdd }: Props) {
  const [query, setQuery] = useState('')
  // 'owned' keeps exercises with unknown equipment out, as in the Library.
  const results = useMemo(
    () =>
      filterExercises(
        exercises,
        {
          query,
          muscles: [],
          equipment: 'owned',
          levels: [],
          suggestedOnly: false,
        },
        equipment,
      ).slice(0, MAX_RESULTS),
    [exercises, query, equipment],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="picker-search" className="text-sm font-medium">
          Search exercises
        </label>
        <input
          id="picker-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-background h-11 rounded-md border px-3"
        />
      </div>
      {results.length === 0 ? (
        <p>No exercises found</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {results.map((exercise) => (
            <li
              key={exercise.id}
              className="bg-card flex min-h-12 items-center justify-between gap-3 rounded-sm border p-2"
            >
              <span className="min-w-0">
                <span className="block font-medium">{exercise.name}</span>
                {exercise.primaryMuscle && (
                  <span className="text-muted-foreground block text-sm">
                    {label(exercise.primaryMuscle)}
                  </span>
                )}
              </span>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 shrink-0 px-3"
                aria-label={`Add ${exercise.name}`}
                onClick={() => onAdd(exercise)}
              >
                <Plus aria-hidden="true" />
                Add
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
