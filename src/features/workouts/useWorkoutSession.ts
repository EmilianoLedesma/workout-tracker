import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from '@/features/auth/useSession'
import type { Routine } from '@/types/routine'
import type { Workout } from '@/types/workout'
import { alertCountdownEnd, keepScreenOn, prepareAudio } from './alerts'
import { isFinished } from './timer'
import { useNow } from './useNow'
import { useSaveSession } from './useSaveSession'
import { clearDraft, loadDraft, saveDraft } from './workoutDraft'
import {
  createWorkout,
  reduce,
  toSessionPayload,
  type Action,
  type DistributiveOmit,
  type SessionPayload,
} from './workoutState'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Runs one workout: state in memory, mirrored to the device on every change,
 * with the clock, the end-of-countdown alert, the screen lock and the final
 * save to the server. Screens only read this and call `act`.
 */
export function useWorkoutSession() {
  const { session } = useSession()
  const saveSession = useSaveSession()
  const [workout, setWorkout] = useState<Workout | null>(() => loadDraft())
  const [summary, setSummary] = useState<SessionPayload | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const saving = useRef(false)

  const running = !!workout && !workout.paused && !workout.finish
  const now = useNow(running)

  // Mirror every change to the device so nothing is lost.
  useEffect(() => {
    if (workout) saveDraft(workout)
  }, [workout])

  // Keep the screen on during a workout, and again after the page returns.
  const live = !!workout && !workout.finish
  useEffect(() => {
    if (!live) return
    let cancelled = false
    let off: (() => void) | undefined
    const acquire = () => {
      off?.()
      off = undefined
      void keepScreenOn().then((release) => {
        if (cancelled) release()
        else off = release
      })
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire()
    }
    acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      off?.()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [live])

  // One alert per countdown, and a timed set completes when its time is up.
  const alerted = useRef<string | null>(null)
  useEffect(() => {
    if (!workout?.timer || workout.paused || workout.finish) return
    if (!isFinished(workout.timer, now)) return
    const key = JSON.stringify([workout.cursor, workout.phase, workout.timer])
    if (alerted.current !== key) {
      alerted.current = key
      alertCountdownEnd()
    }
    const ex = workout.exercises[workout.cursor.exercise]
    if (workout.phase === 'set' && ex?.targetType === 'seconds') {
      setWorkout((w) =>
        w ? reduce(w, { type: 'completeSet', now: Date.now() }) : w,
      )
    }
  }, [workout, now])

  const act = useCallback((action: DistributiveOmit<Action, 'now'>) => {
    setWorkout((w) =>
      w ? reduce(w, { ...action, now: Date.now() } as Action) : w,
    )
  }, [])

  const start = useCallback((routine: Routine) => {
    prepareAudio()
    setSummary(null)
    setStatus('idle')
    setWorkout(
      createWorkout({
        id: crypto.randomUUID(),
        routine,
        now: Date.now(),
        uid: () => crypto.randomUUID(),
      }),
    )
  }, [])

  const discard = useCallback(() => {
    clearDraft()
    setWorkout(null)
    setSummary(null)
    setStatus('idle')
  }, [])

  const { mutateAsync } = saveSession
  const runSave = useCallback(
    (w: Workout) => {
      if (saving.current) return
      saving.current = true
      setStatus('saving')
      const payload = toSessionPayload(w)
      mutateAsync(payload)
        .then(() => {
          clearDraft()
          setSummary(payload)
          setWorkout(null)
          setStatus('saved')
        })
        .catch(() => setStatus('error'))
        .finally(() => {
          saving.current = false
        })
    },
    [mutateAsync],
  )

  // A finished workout is saved as soon as someone is signed in, including one
  // left unsaved by an earlier visit.
  const signedIn = !!session
  useEffect(() => {
    if (workout?.finish && signedIn && status === 'idle') runSave(workout)
  }, [workout, signedIn, status, runSave])

  const retry = useCallback(() => {
    if (workout?.finish) runSave(workout)
  }, [workout, runSave])

  return { workout, now, start, act, discard, save: { status, retry }, summary }
}
