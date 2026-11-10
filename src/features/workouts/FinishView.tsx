import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import type { Exercise } from '@/types/exercise'
import type { Workout } from '@/types/workout'
import { cta } from './SetView'
import type { SaveStatus } from './useWorkoutSession'
import type { SessionPayload } from './workoutState'

type Props = {
  workout: Workout | null
  exercises: Map<string, Exercise>
  saveStatus: SaveStatus
  summary: SessionPayload | null
  onSave: (note: string) => void
  onRetry: () => void
  /** Throws the workout away; only offered when saving keeps failing. */
  onDiscard: () => void
}

type Row = { id: string; done: number; total: number }

const fromWorkout = (w: Workout): Row[] =>
  w.exercises
    .filter((e) => e.status === 'active')
    .map((e) => ({
      id: e.exerciseId,
      done: e.sets.filter((s) => s.actual !== null).length,
      total: e.sets.length,
    }))

const fromSummary = (p: SessionPayload): Row[] =>
  p.log
    .filter((e) => e.status === 'active')
    .map((e) => ({
      id: e.exercise_id,
      done: e.sets.filter((s) => s.actual !== null).length,
      total: e.sets.length,
    }))

export function FinishView({
  workout,
  exercises,
  saveStatus,
  summary,
  onSave,
  onRetry,
  onDiscard,
}: Props) {
  const [note, setNote] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const rows = summary
    ? fromSummary(summary)
    : workout
      ? fromWorkout(workout)
      : []
  const done = rows.reduce((n, r) => n + r.done, 0)
  const total = rows.reduce((n, r) => n + r.total, 0)
  const routineName = summary?.routineName ?? workout?.routineName ?? ''
  const minutes = summary
    ? Math.max(1, Math.round(summary.durationSeconds / 60))
    : null
  const finished = !!summary || !!workout?.finish

  return (
    <div className="flex flex-col gap-4">
      {summary && (
        <p className="font-display text-accent-text text-xl font-black tracking-wider uppercase">
          Workout saved
        </p>
      )}
      <h2 className="font-display text-4xl leading-none font-black uppercase">
        {done} of {total} sets done
      </h2>
      <p className="text-muted-foreground text-sm">
        {routineName}
        {minutes !== null && ` · ${minutes} min`}
      </p>

      <ul className="flex flex-col gap-1">
        {rows.map((r, i) => (
          <li
            key={i}
            className="bg-card flex justify-between border px-2 py-1.5 text-sm"
          >
            <span>
              {exercises.get(r.id)?.name ?? 'Exercise no longer available'}
            </span>
            <span>
              {r.done} of {r.total}
            </span>
          </li>
        ))}
      </ul>

      {!finished && (
        <>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="workout-note"
              className="text-muted-foreground text-sm"
            >
              Note (optional)
            </label>
            <textarea
              id="workout-note"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How did it feel?"
              className="bg-card border-foreground h-20 border-2 p-2"
            />
          </div>
          <Button type="button" className={cta} onClick={() => onSave(note)}>
            Save workout
          </Button>
        </>
      )}

      {finished && !summary && saveStatus !== 'error' && (
        <p role="status">Saving…</p>
      )}

      {saveStatus === 'error' && !summary && (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p>Not saved yet. Your workout is kept on this phone.</p>
          <Button
            type="button"
            className="min-h-11 px-4 font-bold"
            onClick={onRetry}
          >
            Try again
          </Button>
          {confirmingDelete ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="w-full text-sm">
                Delete this workout for good? It has not been saved anywhere.
              </p>
              <Button
                type="button"
                className="min-h-11 px-4 font-bold"
                onClick={onDiscard}
              >
                Delete it
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 px-4 font-bold"
                onClick={() => setConfirmingDelete(false)}
              >
                Keep it
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 px-4 font-bold"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete this workout
            </Button>
          )}
        </div>
      )}

      {summary && (
        <Button asChild className="min-h-11 px-4 font-bold">
          <Link to="/routines">Back to routines</Link>
        </Button>
      )}
    </div>
  )
}
