import { Link, useParams } from 'react-router'
import { ExerciseImage } from '@/components/exercises/ExerciseImage'
import { label } from '@/lib/catalog/label'
import type { Exercise, Provenance } from '@/types/exercise'
import { useExercise } from './useCatalog'

const SOURCE_NAMES: Record<Provenance['source'], string> = {
  'workout-guide': 'Workout Guide',
  'free-exercise-db': 'free-exercise-db',
  project: 'Workout Tracker project',
}

const badge = 'bg-secondary rounded px-2 py-0.5 text-xs font-medium'

function Detail({ exercise }: { exercise: Exercise }) {
  const projectAuthored = exercise.provenance.identity.source === 'project'
  const framed = exercise.frames.find((f) => f.sourceUrl) ?? exercise.frames[0]
  const muscles = [exercise.primaryMuscle, ...exercise.secondaryMuscles]
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .map(label)
    .join(', ')

  return (
    <div className="flex flex-col gap-4">
      <Link to="/library" className="text-sm underline">
        Back to library
      </Link>
      <h1 className="page-title">{exercise.name}</h1>
      <div className="flex flex-wrap gap-2">
        {exercise.level && (
          <span className={badge}>{label(exercise.level)}</span>
        )}
        {projectAuthored && <span className={badge}>Project-authored</span>}
        {projectAuthored && exercise.reviewStatus === 'unreviewed' && (
          <span className={badge}>Unreviewed</span>
        )}
      </div>

      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2">
        {exercise.frames.length > 0 ? (
          exercise.frames.map((frame, i) => (
            <ExerciseImage
              key={frame.src}
              frame={frame}
              alt={`${exercise.name}, position ${i + 1} of ${exercise.frames.length}`}
              className="w-64 shrink-0 snap-center"
            />
          ))
        ) : (
          <ExerciseImage alt={exercise.name} className="w-64" />
        )}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="font-medium">Muscles</dt>
        <dd>{muscles || 'Not specified'}</dd>
        <dt className="font-medium">Equipment</dt>
        <dd>
          {exercise.equipment.length
            ? exercise.equipment.map(label).join(', ')
            : 'Equipment not specified'}
        </dd>
      </dl>

      <section aria-labelledby="instructions-heading">
        <h2 id="instructions-heading" className="section-title">
          Instructions
        </h2>
        {exercise.instructions.length > 0 ? (
          <ol className="mt-2 list-decimal space-y-1 pl-6">
            {exercise.instructions.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground mt-2">
            Instructions not available yet.
          </p>
        )}
      </section>

      <section
        aria-labelledby="sources-heading"
        className="text-muted-foreground space-y-1 text-sm"
      >
        <h2 id="sources-heading" className="section-title text-foreground">
          Sources and license
        </h2>
        {framed && (
          <>
            <p>
              Illustrations by {framed.creator},{' '}
              <a
                href={framed.licenseUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {framed.license}
              </a>
              .
            </p>
            {framed.sourceUrl && (
              <p>
                Derived from{' '}
                <a
                  href={framed.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {framed.sourceUrl}
                </a>
                .
              </p>
            )}
            {framed.changes && <p>Changes: {framed.changes}</p>}
          </>
        )}
        <ul className="list-disc pl-6">
          {Object.entries(exercise.provenance).map(([group, p]) =>
            p ? (
              <li key={group}>
                {label(group)}: {SOURCE_NAMES[p.source]} ({p.license})
              </li>
            ) : null,
          )}
        </ul>
      </section>
    </div>
  )
}

export default function ExerciseDetailPage() {
  const { exerciseId = '' } = useParams()
  const exercise = useExercise(exerciseId)

  if (exercise === 'loading') return <p role="status">Loading exercise…</p>
  if (!exercise) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p>Exercise not found.</p>
        <Link to="/library" className="underline">
          Back to library
        </Link>
      </div>
    )
  }
  return <Detail exercise={exercise} />
}
