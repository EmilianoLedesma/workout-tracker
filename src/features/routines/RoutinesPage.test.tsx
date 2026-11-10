import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import type { Routine } from '@/types/routine'
import RoutinesPage from './RoutinesPage'

const state = vi.hoisted(() => ({
  routines: [] as Routine[],
  isLoading: false,
  error: null as Error | null,
  refetch: vi.fn(),
  seed: vi.fn(),
  seedError: null as Error | null,
  remove: vi.fn(),
  duplicate: vi.fn(),
  removeError: null as Error | null,
  duplicateError: null as Error | null,
  removePending: false,
  duplicatePending: false,
}))

vi.mock('./useRoutines', () => ({
  useRoutines: () => ({
    routines: state.routines,
    isLoading: state.isLoading,
    error: state.error,
    refetch: state.refetch,
  }),
  useSeedStarters: () => ({ mutate: state.seed, isError: !!state.seedError }),
  useDeleteRoutine: () => ({
    mutate: state.remove,
    error: state.removeError,
    isPending: state.removePending,
  }),
  useDuplicateRoutine: () => ({
    mutate: state.duplicate,
    error: state.duplicateError,
    isPending: state.duplicatePending,
  }),
}))

const full: Routine = {
  id: 'r1',
  name: 'Full body baseline',
  dayLabel: 'A',
  isStarter: true,
  items: [
    {
      exerciseId: 'a',
      sets: 2,
      targetType: 'reps',
      target: 8,
      restSeconds: 60,
    },
    {
      exerciseId: 'b',
      sets: 2,
      targetType: 'reps',
      target: 8,
      restSeconds: 60,
    },
  ],
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <RoutinesPage />
    </MemoryRouter>,
  )

beforeEach(() => {
  Object.assign(state, {
    routines: [full],
    isLoading: false,
    error: null,
    removeError: null,
    duplicateError: null,
    removePending: false,
    duplicatePending: false,
  })
  state.refetch.mockReset()
  state.seed.mockReset()
  state.seedError = null
  state.remove.mockReset()
  state.duplicate.mockReset()
})

it('shows each routine with its day label, exercise count and Starter badge', () => {
  renderPage()
  expect(screen.getByRole('heading', { name: 'Routines' })).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: 'Full body baseline' }),
  ).toBeInTheDocument()
  expect(screen.getByText('Day A')).toBeInTheDocument()
  expect(screen.getByText('2 exercises')).toBeInTheDocument()
  expect(screen.getByText('Starter')).toBeInTheDocument()
})

it('links to the editor for new and existing routines', () => {
  renderPage()
  expect(screen.getByRole('link', { name: 'New routine' })).toHaveAttribute(
    'href',
    '/routines/new',
  )
  expect(
    screen.getByRole('link', { name: 'Edit Full body baseline' }),
  ).toHaveAttribute('href', '/routines/r1')
})

it('duplicates a routine', async () => {
  renderPage()
  await userEvent.click(
    screen.getByRole('button', { name: 'Duplicate Full body baseline' }),
  )
  expect(state.duplicate).toHaveBeenCalledWith(full)
})

it('deletes only after confirming', async () => {
  renderPage()
  await userEvent.click(
    screen.getByRole('button', { name: 'Delete Full body baseline' }),
  )
  expect(screen.getByText('Delete Full body baseline?')).toBeInTheDocument()
  expect(state.remove).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
  expect(state.remove).toHaveBeenCalledWith('r1')
})

it('can cancel a delete', async () => {
  renderPage()
  await userEvent.click(
    screen.getByRole('button', { name: 'Delete Full body baseline' }),
  )
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(state.remove).not.toHaveBeenCalled()
  expect(screen.queryByText('Delete Full body baseline?')).toBeNull()
})

it('says starters are a suggestion, not advice', () => {
  renderPage()
  expect(
    screen.getByText(
      'Starter routines are a suggestion, not advice. Edit or delete them freely.',
    ),
  ).toBeInTheDocument()
})

it('shows a loading status', () => {
  Object.assign(state, { routines: [], isLoading: true })
  renderPage()
  expect(screen.getByRole('status')).toHaveTextContent('Loading routines…')
})

it('shows an error with a retry', async () => {
  Object.assign(state, { routines: [], error: new Error('boom') })
  renderPage()
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Could not load your routines.',
  )
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(state.refetch).toHaveBeenCalled()
  expect(state.seed).not.toHaveBeenCalled()
})

it('seeds the starters once when a first visit finds no routines', () => {
  state.routines = []
  const { rerender } = renderPage()
  expect(screen.getByText('No routines yet')).toBeInTheDocument()
  expect(state.seed).toHaveBeenCalledTimes(1)
  rerender(
    <MemoryRouter>
      <RoutinesPage />
    </MemoryRouter>,
  )
  expect(state.seed).toHaveBeenCalledTimes(1)
})

it('offers a retry when seeding the starters failed', async () => {
  state.routines = []
  state.seedError = new Error('x')
  renderPage()
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Could not add the starter routines.',
  )
  state.seed.mockClear()
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(state.seed).toHaveBeenCalledTimes(1)
})

it('does not seed while loading or when routines exist', () => {
  renderPage()
  expect(state.seed).not.toHaveBeenCalled()
})

describe('feedback', () => {
  it('says when a delete failed', () => {
    state.removeError = new Error('x')
    renderPage()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not delete the routine. Try again.',
    )
  })

  it('says when a duplicate failed', () => {
    state.duplicateError = new Error('x')
    renderPage()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not duplicate the routine. Try again.',
    )
  })

  it('disables Duplicate and Delete while a duplicate is saving', () => {
    state.duplicatePending = true
    renderPage()
    expect(
      screen.getByRole('button', { name: 'Duplicate Full body baseline' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Delete Full body baseline' }),
    ).toBeDisabled()
  })

  it('disables the buttons while a delete is saving', () => {
    state.removePending = true
    renderPage()
    expect(
      screen.getByRole('button', { name: 'Duplicate Full body baseline' }),
    ).toBeDisabled()
  })
})

describe('keyboard focus', () => {
  it('moves focus to Cancel when the delete confirmation opens', async () => {
    renderPage()
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete Full body baseline' }),
    )
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('returns focus to the Delete button after Cancel', async () => {
    renderPage()
    await userEvent.click(
      screen.getByRole('button', { name: 'Delete Full body baseline' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(
      screen.getByRole('button', { name: 'Delete Full body baseline' }),
    ).toHaveFocus()
  })
})
