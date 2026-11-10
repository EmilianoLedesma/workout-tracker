import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import type { Exercise } from '@/types/exercise'
import type { Routine } from '@/types/routine'
import { FinishView } from './FinishView'
import { createWorkout, reduce, toSessionPayload } from './workoutState'

const exercises = new Map([
  ['a', { id: 'a', name: 'Wall push-up', frames: [] }],
  ['b', { id: 'b', name: 'Plank', frames: [] }],
] as unknown as [string, Exercise][])

const routine: Routine = {
  id: 'r1',
  name: 'Full body baseline',
  dayLabel: null,
  isStarter: false,
  items: [
    { exerciseId: 'a', sets: 2, targetType: 'reps', target: 8, restSeconds: 0 },
    {
      exerciseId: 'gone',
      sets: 1,
      targetType: 'reps',
      target: 8,
      restSeconds: 0,
    },
  ],
}

// One of three sets done, so the workout is partly finished.
const partly = () => {
  let n = 0
  const w = createWorkout({
    id: 'w1',
    routine,
    now: 0,
    uid: () => `u${++n}`,
  })
  return reduce(w, { type: 'completeSet', now: 1000 })
}
const finished = () =>
  reduce(partly(), { type: 'finish', note: 'x', now: 1200000 })

const setup = (props: Partial<React.ComponentProps<typeof FinishView>>) => {
  const onSave = vi.fn()
  const onRetry = vi.fn()
  const view = render(
    <MemoryRouter>
      <FinishView
        workout={partly()}
        exercises={exercises}
        saveStatus="idle"
        summary={null}
        onSave={onSave}
        onRetry={onRetry}
        {...props}
      />
    </MemoryRouter>,
  )
  return { onSave, onRetry, view }
}

describe('before saving', () => {
  it('counts the sets and sends the note with Save workout', async () => {
    const { onSave } = setup({})
    expect(screen.getByText('1 of 3 sets done')).toBeInTheDocument()
    expect(screen.getByText('Wall push-up')).toBeInTheDocument()
    expect(screen.getByText('1 of 2')).toBeInTheDocument()
    expect(screen.getByText('Exercise no longer available')).toBeInTheDocument()
    const note = screen.getByLabelText('Note (optional)')
    expect(note).toHaveAttribute('maxlength', '500')
    await userEvent.type(note, 'felt ok')
    await userEvent.click(screen.getByRole('button', { name: 'Save workout' }))
    expect(onSave).toHaveBeenCalledWith('felt ok')
  })
})

describe('after finishing', () => {
  it('shows a saving status and no Save button', () => {
    setup({ workout: finished(), saveStatus: 'saving' })
    expect(screen.getByRole('status')).toHaveTextContent('Saving…')
    expect(screen.queryByRole('button', { name: 'Save workout' })).toBeNull()
  })

  it('keeps the workout on the phone and offers a retry when saving fails', async () => {
    const { onRetry } = setup({ workout: finished(), saveStatus: 'error' })
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Not saved yet. Your workout is kept on this phone.',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('shows the saved summary with a way back', () => {
    setup({
      workout: null,
      saveStatus: 'saved',
      summary: toSessionPayload(finished()),
    })
    expect(screen.getByText('Workout saved')).toBeInTheDocument()
    expect(screen.getByText('1 of 3 sets done')).toBeInTheDocument()
    expect(screen.getByText(/Full body baseline/)).toBeInTheDocument()
    expect(screen.getByText(/20 min/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Back to routines' }),
    ).toHaveAttribute('href', '/routines')
  })

  it('never uses the word partial', () => {
    const { view } = setup({
      workout: null,
      saveStatus: 'saved',
      summary: toSessionPayload(finished()),
    })
    expect(view.container.textContent).not.toMatch(/partial/i)
  })
})
