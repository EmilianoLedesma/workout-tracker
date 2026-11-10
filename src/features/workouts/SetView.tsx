import { useEffect, useRef } from 'react'
import { ExerciseImage } from '@/components/exercises/ExerciseImage'
import { Button } from '@/components/ui/button'
import type { Exercise } from '@/types/exercise'
import type { Workout } from '@/types/workout'
import { formatClock, remainingMs } from './timer'
import { currentSet, type Action, type DistributiveOmit } from './workoutState'

export type Act = (action: DistributiveOmit<Action, 'now'>) => void

type Props = {
  workout: Workout
  now: number
  exercises: Map<string, Exercise>
  act: Act
}

export const cta =
  'min-h-16 w-full border-2 border-foreground bg-accent-fill text-foreground hover:bg-accent-fill font-display text-2xl font-black tracking-widest uppercase'
const step = 'min-h-11 flex-1 border-2 border-foreground px-3 font-bold'

export function SetView({ workout, now, exercises, act }: Props) {
  // The previous screen's focused button goes away when the phase changes, so
  // land on the exercise name instead of dropping to the page.
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])
  const cur = currentSet(workout)
  if (!cur) return null
  const { exercise, set, setNumber, setCount } = cur
  const info = exercises.get(exercise.exerciseId)
  const name = info?.name ?? 'Exercise no longer available'
  const timed = exercise.targetType === 'seconds'
  const active = workout.exercises.filter((e) => e.status === 'active')
  const position = active.findIndex((e) => e.uid === exercise.uid) + 1
  const unit = timed ? 'seconds' : 'reps'
  const running = timed && workout.timer
  const clock = formatClock(
    workout.timer ? remainingMs(workout.timer, now) : set.target * 1000,
  )
  const frames = info?.frames ?? []

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        <span>
          Exercise {position} of {active.length}
        </span>
        {' · '}
        <span>
          Set {setNumber} of {setCount}
        </span>
      </p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-4xl leading-none font-black uppercase outline-none"
      >
        {name}
      </h2>

      <div className="flex gap-2">
        {frames.length > 0 ? (
          frames.map((frame, i) => (
            <ExerciseImage
              key={frame.src}
              frame={frame}
              alt={`${name}, position ${i + 1} of ${frames.length}`}
              className="min-w-0 flex-1"
            />
          ))
        ) : (
          <ExerciseImage alt={name} className="w-24" />
        )}
      </div>

      <div className="text-center">
        <p
          data-testid="target"
          role={running ? 'timer' : undefined}
          aria-label={running ? `${clock} remaining` : undefined}
          className="font-display text-8xl leading-none font-black tabular-nums"
        >
          {timed ? clock : set.target}
        </p>
        <p className="text-muted-foreground mt-1 text-sm font-bold tracking-widest uppercase">
          {timed ? 'Seconds' : 'Reps'}
        </p>
      </div>

      <div className="flex gap-2">
        {timed ? (
          <>
            <Button
              type="button"
              variant="outline"
              className={step}
              aria-label="Remove 15 seconds"
              onClick={() => act({ type: 'adjustTarget', delta: -15 })}
            >
              -15 s
            </Button>
            <Button
              type="button"
              variant="outline"
              className={step}
              aria-label="Add 15 seconds"
              onClick={() => act({ type: 'adjustTarget', delta: 15 })}
            >
              +15 s
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              className={step}
              onClick={() => act({ type: 'adjustTarget', delta: -1 })}
            >
              Fewer reps
            </Button>
            <Button
              type="button"
              variant="outline"
              className={step}
              onClick={() => act({ type: 'adjustTarget', delta: 1 })}
            >
              More reps
            </Button>
          </>
        )}
      </div>

      <ol className="flex flex-col gap-1">
        {exercise.sets.map((s, i) => (
          <li
            key={i}
            className={`flex justify-between border px-2 py-1.5 text-sm ${
              i === setNumber - 1
                ? 'bg-accent-fill font-bold'
                : s.actual !== null
                  ? 'bg-card opacity-60'
                  : 'bg-card'
            }`}
          >
            <span>Set {i + 1}</span>
            <span>
              {s.actual ?? s.target} {unit}
            </span>
          </li>
        ))}
      </ol>

      {timed ? (
        !workout.timer && (
          <Button
            type="button"
            className={cta}
            onClick={() => act({ type: 'startTimer' })}
          >
            Start
          </Button>
        )
      ) : (
        <Button
          type="button"
          className={cta}
          onClick={() => act({ type: 'completeSet' })}
        >
          Done
        </Button>
      )}
    </div>
  )
}
