import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Exercise } from '@/types/exercise'
import type { Routine } from '@/types/routine'
import { PlanSheet } from './PlanSheet'
import { createWorkout, reduce } from './workoutState'

const ex = (id: string, name: string) =>
  ({
    id,
    name,
    aliases: [],
    primaryMuscle: null,
    secondaryMuscles: [],
    equipment: ['bodyweight'],
    exerciseType: 'reps',
    level: null,
    category: null,
    isStretch: false,
    description: null,
    instructions: [],
    frames: [],
    reviewStatus: 'unreviewed',
    deprecated: false,
    mergedFrom: [],
  }) as unknown as Exercise

const catalog = [
  ex('wall-push-up', 'Wall push-up'),
  ex('squat', 'Squat'),
  ex('wg-push-up', 'Push-up'),
]

const routine: Routine = {
  id: 'r1',
  name: 'Mine',
  dayLabel: null,
  isStarter: false,
  items: [
    {
      exerciseId: 'wall-push-up',
      sets: 2,
      targetType: 'reps',
      target: 8,
      restSeconds: 60,
    },
    {
      exerciseId: 'squat',
      sets: 2,
      targetType: 'reps',
      target: 8,
      restSeconds: 60,
    },
  ],
}

let n = 0
const fresh = () => {
  n = 0
  return createWorkout({ id: 'w1', routine, now: 0, uid: () => `u${++n}` })
}

const setup = (workout = fresh()) => {
  const act = vi.fn()
  const onFinishEarly = vi.fn()
  const onClose = vi.fn()
  render(
    <PlanSheet
      workout={workout}
      exercises={catalog}
      equipment={['bodyweight']}
      act={act}
      onFinishEarly={onFinishEarly}
      onClose={onClose}
    />,
  )
  return { act, onFinishEarly, onClose }
}

it('says the changes are for today only', () => {
  setup()
  expect(screen.getByText(/apply to today only/i)).toBeInTheDocument()
})

it('adds a set to, or skips, the current exercise', async () => {
  const { act } = setup()
  expect(screen.getByText('This exercise: Wall push-up')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Add a set' }))
  expect(act).toHaveBeenLastCalledWith({ type: 'addSet' })
  await userEvent.click(
    screen.getByRole('button', { name: 'Skip this exercise' }),
  )
  expect(act).toHaveBeenLastCalledWith({ type: 'skipExercise' })
})

it('removes an exercise from today and no longer lists removed ones', async () => {
  const { act } = setup()
  await userEvent.click(screen.getByRole('button', { name: 'Remove Squat' }))
  expect(act).toHaveBeenLastCalledWith({ type: 'removeExercise', uid: 'u2' })

  const removed = reduce(fresh(), { type: 'removeExercise', uid: 'u2', now: 1 })
  render(
    <PlanSheet
      workout={removed}
      exercises={catalog}
      equipment={['bodyweight']}
      act={vi.fn()}
      onFinishEarly={vi.fn()}
      onClose={vi.fn()}
    />,
  )
  expect(screen.getAllByRole('button', { name: 'Remove Squat' })).toHaveLength(
    1,
  )
})

it('adds an exercise from the picker with the routine defaults', async () => {
  const { act } = setup()
  expect(screen.queryByLabelText('Search exercises')).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: 'Add exercise' }))
  await userEvent.click(screen.getByRole('button', { name: 'Add Push-up' }))
  expect(act).toHaveBeenLastCalledWith({
    type: 'addExercise',
    item: {
      exerciseId: 'wg-push-up',
      sets: 2,
      targetType: 'reps',
      target: 8,
      restSeconds: 60,
    },
    uid: expect.any(String),
  })
})

it('pauses and resumes', async () => {
  const { act } = setup()
  await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
  expect(act).toHaveBeenLastCalledWith({ type: 'pause' })

  const paused = reduce(fresh(), { type: 'pause', now: 1 })
  const second = vi.fn()
  render(
    <PlanSheet
      workout={paused}
      exercises={catalog}
      equipment={['bodyweight']}
      act={second}
      onFinishEarly={vi.fn()}
      onClose={vi.fn()}
    />,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Resume' }))
  expect(second).toHaveBeenLastCalledWith({ type: 'resume' })
})

it('finishes early and closes', async () => {
  const { onFinishEarly, onClose } = setup()
  await userEvent.click(screen.getByRole('button', { name: 'Finish early' }))
  expect(onFinishEarly).toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalled()
})

it('hides the current-exercise actions once every set is done', () => {
  let w = fresh()
  for (let i = 0; i < 4; i++) {
    w = reduce(w, { type: 'completeSet', now: i * 100000 })
    w = reduce(w, { type: 'endRest', now: i * 100000 + 1 })
  }
  expect(w.phase).toBe('review')
  setup(w)
  expect(screen.queryByRole('button', { name: 'Add a set' })).toBeNull()
})

it('keeps every button at least 44 px high', () => {
  setup()
  for (const b of screen.getAllByRole('button')) {
    expect(b.className).toMatch(/min-h-1[1-9]/)
  }
})
