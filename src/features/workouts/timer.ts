import type { Timer } from '@/types/workout'

/** m:ss, rounding a partial second up so the clock never shows 0:00 early. */
export const formatClock = (ms: number): string => {
  const total = Math.ceil(Math.max(0, ms) / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export const startTimer = (now: number, seconds: number): Timer => ({
  endsAt: now + seconds * 1000,
})

export const remainingMs = (t: Timer, now: number): number =>
  Math.max(0, 'endsAt' in t ? t.endsAt - now : t.remainingMs)

export const isFinished = (t: Timer, now: number): boolean =>
  remainingMs(t, now) === 0

export const pauseTimer = (t: Timer, now: number): Timer =>
  'endsAt' in t ? { remainingMs: remainingMs(t, now) } : t

export const resumeTimer = (t: Timer, now: number): Timer =>
  'remainingMs' in t ? { endsAt: now + t.remainingMs } : t

export const addSeconds = (t: Timer, now: number, seconds: number): Timer =>
  'endsAt' in t
    ? { endsAt: Math.max(now, t.endsAt + seconds * 1000) }
    : { remainingMs: Math.max(0, t.remainingMs + seconds * 1000) }
