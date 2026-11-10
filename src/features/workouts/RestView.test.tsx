import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Exercise } from '@/types/exercise'
import type { Routine } from '@/types/routine'
import { RestView } from './RestView'
import { createWorkout, reduce } from './workoutState'

const routine: Routine = {
  id: 'r1',
  name: 'Mine',
  dayLabel: null,
  isStarter: false,
  items: [
    {
      exerciseId: 'a',
      sets: 1,
      targetType: 'reps',
      target: 8,
      restSeconds: 60,
    },
    {
      exerciseId: 'b',
      sets: 2,
      targetType: 'reps',
      target: 10,
      restSeconds: 60,
    },
  ],
}
const exercises = new Map([
  ['a', { id: 'a', name: 'Wall push-up', frames: [] }],
  ['b', { id: 'b', name: 'Glute bridge', frames: [] }],
] as unknown as [string, Exercise][])

// Set done at t=0, so the 60 s rest ends at 60000.
const resting = () =>
  reduce(createWorkout({ id: 'w1', routine, now: 0, uid: () => 'u' }), {
    type: 'completeSet',
    now: 0,
  })

const setup = (now: number, map = exercises) => {
  const act = vi.fn()
  render(<RestView workout={resting()} now={now} exercises={map} act={act} />)
  return act
}

describe('while resting', () => {
  it('counts down and previews the next set', () => {
    setup(19000)
    expect(screen.getByRole('timer')).toHaveTextContent('0:41')
    expect(screen.getByRole('timer')).toHaveAccessibleName(/0:41 of rest left/)
    expect(screen.getByText('Glute bridge')).toBeInTheDocument()
    expect(screen.getByText(/Set 1 of 2/)).toBeInTheDocument()
    expect(screen.getByText(/10 reps/)).toBeInTheDocument()
  })

  it('extends, shortens and skips the rest', async () => {
    const act = setup(19000)
    await userEvent.click(
      screen.getByRole('button', { name: 'Add 15 seconds' }),
    )
    expect(act).toHaveBeenLastCalledWith({ type: 'adjustRest', delta: 15 })
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove 15 seconds' }),
    )
    expect(act).toHaveBeenLastCalledWith({ type: 'adjustRest', delta: -15 })
    await userEvent.click(screen.getByRole('button', { name: 'Skip rest' }))
    expect(act).toHaveBeenLastCalledWith({ type: 'endRest' })
  })

  it('keeps every button at least 44 px high', () => {
    setup(19000)
    for (const b of screen.getAllByRole('button')) {
      expect(b.className).toMatch(/min-h-1[1-9]/)
    }
  })

  it('names the exercise even when it is gone from the catalog', () => {
    setup(19000, new Map())
    expect(screen.getByText('Exercise no longer available')).toBeInTheDocument()
  })
})

describe('for screen readers and keyboards', () => {
  it('moves focus to the rest label when the screen appears', () => {
    setup(19000)
    expect(screen.getByText('Rest')).toHaveFocus()
  })

  it('announces when the rest is over', () => {
    setup(61000)
    expect(screen.getByRole('status')).toHaveTextContent('Rest over')
  })
})

describe('when the rest is over', () => {
  it('says so, flashes unless motion is reduced, and starts the next set', async () => {
    const act = setup(61000)
    const over = screen.getByText('Rest over')
    expect(over.closest('[data-flash]')?.className).toContain(
      'motion-reduce:animate-none',
    )
    expect(screen.queryByRole('button', { name: 'Skip rest' })).toBeNull()
    await userEvent.click(
      screen.getByRole('button', { name: 'Start next set' }),
    )
    expect(act).toHaveBeenLastCalledWith({ type: 'endRest' })
  })
})
