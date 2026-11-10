import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Exercise } from '@/types/exercise'
import { ExercisePicker } from './ExercisePicker'

const ex = (
  id: string,
  name: string,
  equipment: Exercise['equipment'] = ['bodyweight'],
) =>
  ({
    id,
    name,
    aliases: [],
    primaryMuscle: null,
    secondaryMuscles: [],
    equipment,
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

const pushUp = ex('wg-push-up', 'Push-up')
const squat = ex('wg-squat', 'Squat')
const unknownGear = ex('fed-mystery', 'Mystery Move', [])

const setup = (onAdd = vi.fn()) => {
  render(
    <ExercisePicker
      exercises={[pushUp, squat, unknownGear]}
      equipment={['bodyweight']}
      onAdd={onAdd}
    />,
  )
  return onAdd
}

it('finds an exercise ignoring punctuation', async () => {
  setup()
  await userEvent.type(screen.getByLabelText('Search exercises'), 'push up')
  expect(
    screen.getByRole('button', { name: 'Add Push-up' }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Add Squat' })).toBeNull()
})

it('adds the chosen exercise', async () => {
  const onAdd = setup()
  await userEvent.click(screen.getByRole('button', { name: 'Add Push-up' }))
  expect(onAdd).toHaveBeenCalledWith(pushUp)
})

it('never lists an exercise with unknown equipment', () => {
  setup()
  expect(screen.queryByRole('button', { name: 'Add Mystery Move' })).toBeNull()
})

it('says when nothing matches', async () => {
  setup()
  await userEvent.type(screen.getByLabelText('Search exercises'), 'zzzz')
  expect(screen.getByText('No exercises found')).toBeInTheDocument()
})

it('lists at most 20 results', () => {
  const many = Array.from({ length: 30 }, (_, i) => ex(`id-${i}`, `Move ${i}`))
  render(
    <ExercisePicker
      exercises={many}
      equipment={['bodyweight']}
      onAdd={vi.fn()}
    />,
  )
  expect(screen.getAllByRole('button', { name: /^Add / })).toHaveLength(20)
})
