import {
  addSeconds,
  isFinished,
  pauseTimer,
  remainingMs,
  resumeTimer,
  startTimer,
} from './timer'

describe('timer', () => {
  it('counts down from the start time', () => {
    const t = startTimer(1000, 30)
    expect(remainingMs(t, 1000)).toBe(30000)
    expect(remainingMs(t, 11000)).toBe(20000)
    expect(isFinished(t, 30999)).toBe(false)
    expect(isFinished(t, 31000)).toBe(true)
  })

  it('never reports below zero, even long after the end', () => {
    expect(remainingMs(startTimer(0, 5), 10 ** 9)).toBe(0)
  })

  it('freezes when paused and continues from there on resume', () => {
    const paused = pauseTimer(startTimer(0, 30), 11000)
    expect(remainingMs(paused, 11000)).toBe(19000)
    expect(remainingMs(paused, 999999)).toBe(19000)
    const resumed = resumeTimer(paused, 50000)
    expect(remainingMs(resumed, 50000)).toBe(19000)
    expect(isFinished(resumed, 69000)).toBe(true)
  })

  it('adds and removes seconds on running and paused timers', () => {
    expect(remainingMs(addSeconds(startTimer(0, 30), 10000, 15), 10000)).toBe(
      35000,
    )
    const paused = pauseTimer(startTimer(0, 30), 10000)
    expect(remainingMs(addSeconds(paused, 99999, -5), 99999)).toBe(15000)
  })

  it('clamps at zero when too much is removed', () => {
    expect(remainingMs(addSeconds(startTimer(0, 10), 0, -999), 0)).toBe(0)
  })

  it('leaves a timer alone when pausing twice or resuming a running one', () => {
    const running = startTimer(0, 30)
    expect(resumeTimer(running, 5000)).toBe(running)
    const paused = pauseTimer(running, 5000)
    expect(pauseTimer(paused, 9000)).toBe(paused)
  })
})
