import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Copy, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/features/settings/useSettings'
import { loadDraft } from '@/features/workouts/workoutDraft'
import type { Routine } from '@/types/routine'
import {
  useDeleteRoutine,
  useDuplicateRoutine,
  useRoutines,
  useSeedStarters,
} from './useRoutines'

const badge = 'bg-secondary rounded-sm px-2 py-0.5 text-xs font-medium'

export default function RoutinesPage() {
  const { routines, isLoading, error, refetch } = useRoutines()
  const seed = useSeedStarters()
  const { settings, isLoading: settingsLoading } = useSettings()
  const remove = useDeleteRoutine()
  const duplicate = useDuplicateRoutine()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  // An unfinished workout on this phone, read once when the page opens.
  const [draft] = useState(() => loadDraft())
  // One request at a time: a double tap must not make two copies.
  const busy = remove.isPending || duplicate.isPending
  const failure = remove.error
    ? 'Could not delete the routine. Try again.'
    : duplicate.error
      ? 'Could not duplicate the routine. Try again.'
      : null

  // First visit: copy the starters once. The SQL function is idempotent and
  // remembers it ran, so they never come back after the owner deletes them.
  const seeded = useRef(false)
  useEffect(() => {
    if (
      !isLoading &&
      !settingsLoading &&
      !settings.startersSeeded &&
      !error &&
      routines.length === 0 &&
      !seeded.current
    ) {
      seeded.current = true
      seed.mutate()
    }
  }, [
    isLoading,
    settingsLoading,
    settings.startersSeeded,
    error,
    routines.length,
    seed,
  ])

  let body
  if (isLoading) {
    body = <p role="status">Loading routines…</p>
  } else if (error) {
    body = (
      <div role="alert" className="flex flex-col items-start gap-2">
        <p>Could not load your routines.</p>
        <Button className="h-11" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    )
  } else if (routines.length === 0) {
    body = seed.isError ? (
      <div role="alert" className="flex flex-col items-start gap-2">
        <p>Could not add the starter routines.</p>
        <Button className="h-11" onClick={() => seed.mutate()}>
          Try again
        </Button>
      </div>
    ) : (
      <p>No routines yet</p>
    )
  } else {
    body = (
      <ul className="grid gap-3 md:grid-cols-2">
        {routines.map((routine) => (
          <RoutineCard
            key={routine.id}
            routine={routine}
            confirming={confirmingId === routine.id}
            busy={busy}
            onAskDelete={() => setConfirmingId(routine.id)}
            onCancelDelete={() => setConfirmingId(null)}
            onDelete={() => {
              remove.mutate(routine.id)
              setConfirmingId(null)
            }}
            onDuplicate={() => duplicate.mutate(routine)}
          />
        ))}
      </ul>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-title">Routines</h1>
        <Button asChild className="min-h-11 px-4">
          <Link to="/routines/new">
            <Plus aria-hidden="true" />
            New routine
          </Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Starter routines are a suggestion, not advice. Edit or delete them
        freely.
      </p>
      {draft && (
        <div className="bg-card flex items-center justify-between gap-3 rounded-sm border p-3">
          <div>
            <p className="font-medium">
              {draft.finish ? 'Workout not saved yet' : 'Workout in progress'}
            </p>
            <p className="text-muted-foreground text-sm">{draft.routineName}</p>
          </div>
          <Button asChild className="min-h-11 px-4">
            <Link
              to={draft.routineId ? `/workout/${draft.routineId}` : '/routines'}
            >
              {draft.finish ? 'Open' : 'Continue'}
            </Link>
          </Button>
        </div>
      )}
      {failure && <p role="alert">{failure}</p>}
      {body}
    </div>
  )
}

function RoutineCard({
  routine,
  confirming,
  busy,
  onAskDelete,
  onCancelDelete,
  onDelete,
  onDuplicate,
}: {
  routine: Routine
  confirming: boolean
  busy: boolean
  onAskDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const count = routine.items.length
  // Moving between the buttons and the confirmation drops the focused element,
  // so put focus where the keyboard user expects it: Cancel when the question
  // opens, the Delete button again when it is dismissed.
  const cancelRef = useRef<HTMLButtonElement>(null)
  const deleteRef = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)
  useEffect(() => {
    if (confirming) cancelRef.current?.focus()
    else if (wasConfirming.current) deleteRef.current?.focus()
    wasConfirming.current = confirming
  }, [confirming])
  return (
    <li className="bg-card flex flex-col gap-3 rounded-sm border p-4">
      <div>
        <h2 className="section-title">{routine.name}</h2>
        <div className="mt-1 flex flex-wrap gap-2">
          {routine.dayLabel && (
            <span className={badge}>Day {routine.dayLabel}</span>
          )}
          <span className={badge}>
            {count} {count === 1 ? 'exercise' : 'exercises'}
          </span>
          {routine.isStarter && <span className={badge}>Starter</span>}
        </div>
      </div>
      {confirming ? (
        <div
          role="alertdialog"
          aria-label={`Delete ${routine.name}?`}
          className="flex flex-wrap items-center gap-2"
        >
          <p className="w-full text-sm">Delete {routine.name}?</p>
          <Button className="min-h-11 px-4" onClick={onDelete}>
            Delete
          </Button>
          <Button
            ref={cancelRef}
            variant="outline"
            className="min-h-11 px-4"
            onClick={onCancelDelete}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button asChild className="min-h-11 px-4">
            <Link
              to={`/workout/${routine.id}`}
              aria-label={`Start ${routine.name}`}
            >
              <Play aria-hidden="true" />
              Start
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="min-h-11 px-3"
            aria-label={`Edit ${routine.name}`}
          >
            <Link to={`/routines/${routine.id}`}>
              <Pencil aria-hidden="true" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            className="min-h-11 px-3"
            aria-label={`Duplicate ${routine.name}`}
            disabled={busy}
            onClick={onDuplicate}
          >
            <Copy aria-hidden="true" />
            Duplicate
          </Button>
          <Button
            ref={deleteRef}
            variant="outline"
            className="min-h-11 px-3"
            aria-label={`Delete ${routine.name}`}
            disabled={busy}
            onClick={onAskDelete}
          >
            <Trash2 aria-hidden="true" />
            Delete
          </Button>
        </div>
      )}
    </li>
  )
}
