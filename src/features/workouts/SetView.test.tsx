import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Exercise } from '@/types/exercise'
import type { Routine, RoutineExercise } from '@/types/routine'
import { SetView } from './SetView'
import { createWorkout, reduce } from './workoutState'

const item = (
  exerciseId: string,
  over: Partial<RoutineExercise> = {},
): RoutineExercise => ({
  exerciseId,
  sets: 2,
  targetType: 'reps',
  target: 8,
  restSeconds: 60,
  ...over,
})

const start = (...items: RoutineExercise[]) =>
  createWorkout({
    id: 'w1',
    routine: {
      id: 'r1',
      name: 'Mine',
      dayLabel: null,
      isStarter: false,
      items,
    } as Routine,
    now: 0,
    uid: (() => {
      let n = 0
      return () => `u${++n}`
    })(),
  })

const frame = (n: number) => ({
  src: `/f${n}.png`,
  width: 512,
  height: 512,
  creator: 'c',
  license: 'l',
  licenseUrl: 'u',
})
const exercises = new Map([
  [
    'wall-push-up',
    {
      id: 'wall-push-up',
      name: 'Wall push-up',
      frames: [frame(1), frame(2), frame(3)],
    },
  ],
  ['plank', { id: 'plank', name: 'Plank', frames: [] }],
] as unknown as [string, Exercise][])

const setup = (workout: ReturnType<typeof start>, now = 0, map = exercises) => {
  const act = vi.fn()
  render(<SetView workout={workout} now={now} exercises={map} act={act} />)
  return act
}

describe('reps exercise', () => {
  const w = () => start(item('wall-push-up'), item('plank'))

  it('shows where you are, the target and the illustrations', () => {
    setup(w())
    expect(
      screen.getByRole('heading', { name: 'Wall push-up' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Exercise 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('Set 1 of 2')).toBeInTheDocument()
    expect(screen.getByTestId('target')).toHaveTextContent('8')
    expect(screen.getByText('Reps')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Wall push-up, position 2 of 3' }),
    ).toBeInTheDocument()
  })

  it('logs the set with Done and steps the reps by one', async () => {
    const act = setup(w())
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(act).toHaveBeenLastCalledWith({ type: 'completeSet' })
    await userEvent.click(screen.getByRole('button', { name: 'More reps' }))
    expect(act).toHaveBeenLastCalledWith({ type: 'adjustTarget', delta: 1 })
    await userEvent.click(screen.getByRole('button', { name: 'Fewer reps' }))
    expect(act).toHaveBeenLastCalledWith({ type: 'adjustTarget', delta: -1 })
  })

  it('moves focus to the exercise name when the screen appears', () => {
    setup(w())
    expect(screen.getByRole('heading', { name: 'Wall push-up' })).toHaveFocus()
  })

  it('lists the sets of the exercise', () => {
    setup(w())
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('says so when the exercise is gone from the catalog', () => {
    setup(w(), 0, new Map())
    expect(
      screen.getByRole('heading', { name: 'Exercise no longer available' }),
    ).toBeInTheDocument()
  })

  it('keeps every button at least 44 px high', () => {
    setup(w())
    for (const b of screen.getAllByRole('button')) {
      expect(b.className).toMatch(/min-h-1[1-9]/)
    }
  })
})

describe('timed exercise', () => {
  const w = () =>
    start(item('plank', { targetType: 'seconds', target: 30, sets: 1 }))

  it('starts with a Start button and no Done button', async () => {
    const act = setup(w())
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull()
    expect(screen.getByTestId('target')).toHaveTextContent('0:30')
    await userEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(act).toHaveBeenLastCalledWith({ type: 'startTimer' })
  })

  it('adds and removes 15 seconds', async () => {
    const act = setup(w())
    await userEvent.click(
      screen.getByRole('button', { name: 'Add 15 seconds' }),
    )
    expect(act).toHaveBeenLastCalledWith({ type: 'adjustTarget', delta: 15 })
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove 15 seconds' }),
    )
    expect(act).toHaveBeenLastCalledWith({ type: 'adjustTarget', delta: -15 })
  })

  it('shows a running countdown as a timer', () => {
    const running = reduce(w(), { type: 'startTimer', now: 0 })
    setup(running, 8000)
    const timer = screen.getByRole('timer')
    expect(timer).toHaveTextContent('0:22')
    expect(timer).toHaveAccessibleName(/0:22 remaining/)
    expect(screen.queryByRole('button', { name: 'Start' })).toBeNull()
  })
})
