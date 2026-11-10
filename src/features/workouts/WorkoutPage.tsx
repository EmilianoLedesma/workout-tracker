import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { useCatalog } from '@/features/exercises/useCatalog'
import { useRoutine } from '@/features/routines/useRoutines'
import { useSettings } from '@/features/settings/useSettings'
import { prepareAudio } from './alerts'
import { FinishView } from './FinishView'
import { PlanSheet } from './PlanSheet'
import { RestView } from './RestView'
import { ResumePrompt } from './ResumePrompt'
import { cta, SetView } from './SetView'
import { useWorkoutSession } from './useWorkoutSession'
import { isStale, loadDraft } from './workoutDraft'

const outline = 'min-h-11 w-full border-2 border-foreground font-bold'

export default function WorkoutPage() {
  const { routineId = '' } = useParams()
  // A draft found on arrival is continued without asking only when it belongs
  // to this routine and is recent. A finished one is just waiting to be saved.
  // While asking, the session hook is held so nothing runs behind the prompt.
  const [asking, setAsking] = useState(() => {
    const draft = loadDraft()
    return (
      !!draft &&
      !draft.finish &&
      (draft.routineId !== routineId || isStale(draft, Date.now()))
    )
  })
  const { workout, now, start, act, discard, save, summary } =
    useWorkoutSession({ hold: asking })
  const { routine, error } = useRoutine(routineId)
  const catalog = useCatalog()
  const { settings } = useSettings()
  const [planOpen, setPlanOpen] = useState(false)
  const [finishing, setFinishing] = useState(false)

  const exerciseList = catalog.data?.exercises
  const exercises = useMemo(
    () => new Map((exerciseList ?? []).map((e) => [e.id, e])),
    [exerciseList],
  )

  // No draft: start the routine once. The workout then lives on its own
  // snapshot, so later routine edits or deletes do not touch it.
  const started = useRef(false)
  useEffect(() => {
    if (workout || summary || started.current || !routine) return
    started.current = true
    start(routine)
  }, [workout, summary, routine, start])

  const finishView = (
    <FinishView
      workout={workout}
      exercises={exercises}
      saveStatus={save.status}
      summary={summary}
      onSave={(note) => act({ type: 'finish', note })}
      onRetry={save.retry}
    />
  )

  if (summary) return finishView

  if (workout) {
    if (asking) {
      return (
        <ResumePrompt
          draft={workout}
          stale={isStale(workout, now)}
          onContinue={() => setAsking(false)}
          onDiscard={() => {
            discard()
            setAsking(false)
          }}
        />
      )
    }
    if (workout.finish) return finishView
    if (finishing) {
      return (
        <div className="flex flex-col gap-4">
          {finishView}
          <Button
            type="button"
            variant="outline"
            className={outline}
            onClick={() => setFinishing(false)}
          >
            Keep going
          </Button>
        </div>
      )
    }
    if (workout.paused) {
      return (
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-accent-text text-xl font-black tracking-wider uppercase">
            {workout.routineName}
          </h1>
          <p>Paused. Timers are stopped.</p>
          <Button
            type="button"
            className={cta}
            onClick={() => act({ type: 'resume' })}
          >
            Resume
          </Button>
          <Button
            type="button"
            variant="outline"
            className={outline}
            onClick={() => setFinishing(true)}
          >
            Finish early
          </Button>
        </div>
      )
    }
    return (
      <>
        <div
          className="flex flex-col gap-4"
          inert={planOpen}
          onPointerDown={() => prepareAudio()}
        >
          <header className="flex items-center justify-between gap-2">
            <h1 className="font-display text-accent-text text-xl font-black tracking-wider uppercase">
              {workout.routineName}
            </h1>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 border-2 border-foreground px-4 font-bold"
              onClick={() => setPlanOpen(true)}
            >
              Plan
            </Button>
          </header>

          {workout.phase === 'set' && (
            <SetView
              workout={workout}
              now={now}
              exercises={exercises}
              act={act}
            />
          )}
          {workout.phase === 'rest' && (
            <RestView
              workout={workout}
              now={now}
              exercises={exercises}
              act={act}
            />
          )}
          {workout.phase === 'review' && (
            <div className="flex flex-col gap-4">
              <h2 className="font-display text-4xl leading-none font-black uppercase">
                All sets done
              </h2>
              <Button
                type="button"
                className={cta}
                onClick={() => setFinishing(true)}
              >
                Finish
              </Button>
            </div>
          )}
          {workout.phase !== 'review' && (
            <Button
              type="button"
              variant="outline"
              className={outline}
              onClick={() => act({ type: 'pause' })}
            >
              Pause
            </Button>
          )}
        </div>
        {planOpen && (
          <PlanSheet
            workout={workout}
            exercises={exerciseList ?? []}
            equipment={settings.equipment}
            act={act}
            onFinishEarly={() => {
              setPlanOpen(false)
              setFinishing(true)
            }}
            onClose={() => setPlanOpen(false)}
          />
        )}
      </>
    )
  }

  if (error && routine === undefined) {
    return <p role="alert">Could not load this routine.</p>
  }
  if (routine === undefined) return <p role="status">Loading routine…</p>
  if (routine === null) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p>Routine not found</p>
        <Button asChild className="min-h-11 px-4">
          <Link to="/routines">Back to routines</Link>
        </Button>
      </div>
    )
  }
  return <p role="status">Starting…</p>
}
