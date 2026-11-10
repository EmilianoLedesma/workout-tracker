import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ExercisePicker } from '@/features/routines/ExercisePicker'
import { defaultItem } from '@/features/routines/routineDraft'
import type { Equipment } from '@/lib/catalog/vocab'
import type { Exercise } from '@/types/exercise'
import type { Workout } from '@/types/workout'
import type { Act } from './SetView'
import { planTarget } from './workoutState'

type Props = {
  workout: Workout
  exercises: Exercise[]
  equipment: readonly Equipment[]
  act: Act
  onFinishEarly: () => void
  onClose: () => void
}

const wide = 'min-h-11 w-full border-2 border-foreground font-bold'
const heading = 'text-sm font-bold tracking-widest uppercase'

export function PlanSheet({
  workout,
  exercises,
  equipment,
  act,
  onFinishEarly,
  onClose,
}: Props) {
  const [adding, setAdding] = useState(false)
  const names = new Map(exercises.map((e) => [e.id, e.name]))
  const nameOf = (id: string) => names.get(id) ?? 'Exercise no longer available'
  const target = planTarget(workout)
  const active = workout.exercises.filter((e) => e.status === 'active')

  return (
    <section
      aria-label="Today's plan"
      className="bg-background fixed inset-0 z-20 flex flex-col gap-3 overflow-auto p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-accent-text text-xl font-black tracking-wider uppercase">
          Today&apos;s plan
        </h2>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 border-2 border-foreground px-4 font-bold"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Changes here apply to today only. Edit the routine in Routines.
      </p>

      {target && (
        <>
          <p className={heading}>This exercise: {nameOf(target.exerciseId)}</p>
          <Button
            type="button"
            variant="outline"
            className={wide}
            onClick={() => act({ type: 'addSet' })}
          >
            Add a set
          </Button>
          {workout.phase === 'set' && (
            <Button
              type="button"
              variant="outline"
              className={wide}
              onClick={() => act({ type: 'skipExercise' })}
            >
              Skip this exercise
            </Button>
          )}
        </>
      )}

      <p className={heading}>Exercises</p>
      <ul className="flex flex-col gap-2">
        {active.map((e) => (
          <li
            key={e.uid}
            className="bg-card flex min-h-11 items-center justify-between gap-2 border px-3"
          >
            <span>{nameOf(e.exerciseId)}</span>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 px-3 text-xs font-bold uppercase"
              aria-label={`Remove ${nameOf(e.exerciseId)}`}
              onClick={() => act({ type: 'removeExercise', uid: e.uid })}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>

      {adding ? (
        <ExercisePicker
          exercises={exercises}
          equipment={equipment}
          onAdd={(exercise) => {
            act({
              type: 'addExercise',
              item: defaultItem(exercise),
              uid: crypto.randomUUID(),
            })
            setAdding(false)
          }}
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          className={wide}
          onClick={() => setAdding(true)}
        >
          Add exercise
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        className={wide}
        onClick={() => act({ type: workout.paused ? 'resume' : 'pause' })}
      >
        {workout.paused ? 'Resume' : 'Pause'}
      </Button>
      <Button
        type="button"
        variant="outline"
        className={wide}
        onClick={onFinishEarly}
      >
        Finish early
      </Button>
    </section>
  )
}
