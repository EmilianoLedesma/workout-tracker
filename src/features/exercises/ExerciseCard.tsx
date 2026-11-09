import { Link } from 'react-router'
import { ExerciseImage } from '@/components/exercises/ExerciseImage'
import { label } from '@/lib/catalog/label'
import type { Exercise } from '@/types/exercise'

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const equipment = exercise.equipment.length
    ? exercise.equipment.map(label).join(', ')
    : 'Equipment not specified'
  return (
    <Link
      to={`/library/${exercise.id}`}
      className="hover:bg-muted flex min-h-16 items-center gap-3 rounded-lg border p-2"
    >
      <ExerciseImage
        frame={exercise.frames[0]}
        alt=""
        className="size-16 shrink-0"
      />
      <span className="min-w-0">
        <span className="block font-medium">{exercise.name}</span>
        <span className="text-muted-foreground block text-sm">
          {exercise.primaryMuscle ? `${label(exercise.primaryMuscle)} · ` : ''}
          {equipment}
        </span>
        {exercise.level && (
          <span className="bg-secondary mt-1 inline-block rounded px-1.5 py-0.5 text-xs">
            {label(exercise.level)}
          </span>
        )}
      </span>
    </Link>
  )
}
