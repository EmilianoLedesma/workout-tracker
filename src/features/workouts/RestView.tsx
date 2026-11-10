import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import type { Exercise } from '@/types/exercise'
import type { Workout } from '@/types/workout'
import { cta, type Act } from './SetView'
import { formatClock, remainingMs } from './timer'
import { currentSet } from './workoutState'

type Props = {
  workout: Workout
  now: number
  exercises: Map<string, Exercise>
  act: Act
}

const step = 'min-h-11 flex-1 border-2 border-foreground px-3 font-bold'

export function RestView({ workout, now, exercises, act }: Props) {
  // Focus lands on the label when this screen replaces the set screen.
  const labelRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => labelRef.current?.focus(), [])
  const next = currentSet(workout)
  const left = workout.timer ? remainingMs(workout.timer, now) : 0
  const over = left === 0
  const name = next
    ? (exercises.get(next.exercise.exerciseId)?.name ??
      'Exercise no longer available')
    : ''
  const unit = next?.exercise.targetType === 'seconds' ? 'seconds' : 'reps'

  return (
    <div className="flex flex-col gap-4">
      <p
        ref={labelRef}
        tabIndex={-1}
        className="text-muted-foreground text-sm outline-none"
      >
        Rest
      </p>

      {over ? (
        <div
          role="status"
          data-flash
          className="bg-accent-fill border-foreground animate-pulse border-2 py-6 text-center motion-reduce:animate-none"
        >
          <p className="font-display text-6xl font-black uppercase">
            Rest over
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p
            role="timer"
            aria-label={`${formatClock(left)} of rest left`}
            className="font-display text-8xl leading-none font-black tabular-nums"
          >
            {formatClock(left)}
          </p>
          <p className="text-muted-foreground mt-1 text-sm font-bold tracking-widest uppercase">
            Seconds of rest left
          </p>
        </div>
      )}

      {!over && (
        <>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className={step}
              aria-label="Remove 15 seconds"
              onClick={() => act({ type: 'adjustRest', delta: -15 })}
            >
              -15 s
            </Button>
            <Button
              type="button"
              variant="outline"
              className={step}
              aria-label="Add 15 seconds"
              onClick={() => act({ type: 'adjustRest', delta: 15 })}
            >
              +15 s
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full border-2 border-foreground font-bold"
            onClick={() => act({ type: 'endRest' })}
          >
            Skip rest
          </Button>
        </>
      )}

      {next && (
        <div>
          <p className="text-muted-foreground text-sm">Next</p>
          <p className="font-display text-2xl font-black uppercase">{name}</p>
          <p className="text-muted-foreground text-sm">
            Set {next.setNumber} of {next.setCount} · {next.set.target} {unit}
          </p>
        </div>
      )}

      {over && (
        <Button
          type="button"
          className={cta}
          onClick={() => act({ type: 'endRest' })}
        >
          Start next set
        </Button>
      )}
    </div>
  )
}
