import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Routine } from '@/types/routine'
import { ResumePrompt } from './ResumePrompt'
import { createWorkout } from './workoutState'

const routine: Routine = {
  id: 'r1',
  name: 'Full body baseline',
  dayLabel: null,
  isStarter: false,
  items: [],
}
const draft = createWorkout({ id: 'w1', routine, now: 0, uid: () => 'u' })

const setup = (stale: boolean) => {
  const onContinue = vi.fn()
  const onDiscard = vi.fn()
  render(
    <ResumePrompt
      draft={draft}
      stale={stale}
      onContinue={onContinue}
      onDiscard={onDiscard}
    />,
  )
  return { onContinue, onDiscard }
}

it('names the unfinished workout and offers both ways forward', async () => {
  const { onContinue, onDiscard } = setup(false)
  expect(screen.getByText(/Full body baseline/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
  expect(onContinue).toHaveBeenCalled()
  await userEvent.click(
    screen.getByRole('button', { name: 'Discard and start new' }),
  )
  expect(onDiscard).toHaveBeenCalled()
})

it('says when the workout is old', () => {
  setup(true)
  expect(screen.getByText(/more than a day ago/i)).toBeInTheDocument()
})

it('keeps its buttons at least 44 px high', () => {
  setup(false)
  for (const b of screen.getAllByRole('button')) {
    expect(b.className).toMatch(/min-h-1[1-9]/)
  }
})
