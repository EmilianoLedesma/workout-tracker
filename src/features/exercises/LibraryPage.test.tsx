import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import type { Exercise } from '@/types/exercise'
import LibraryPage from './LibraryPage'

const ex = (id: string, name: string, equipment: Exercise['equipment']) =>
  ({
    id,
    name,
    aliases: [],
    primaryMuscle: 'chest',
    secondaryMuscles: [],
    equipment,
    level: null,
    frames: [],
    deprecated: false,
  }) as unknown as Exercise

const state = vi.hoisted(() => ({
  catalog: {
    data: undefined as { exercises: unknown[] } | undefined,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  },
}))

vi.mock('./useCatalog', () => ({ useCatalog: () => state.catalog }))
vi.mock('@/features/settings/useSettings', () => ({
  useSettings: () => ({
    settings: { weeklyGoal: 3, equipment: ['bodyweight'], theme: 'system' },
    isLoading: false,
    error: null,
  }),
}))

const setExercises = (exercises: Exercise[]) => {
  state.catalog.data = { exercises }
  state.catalog.isPending = false
  state.catalog.isError = false
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <LibraryPage />
    </MemoryRouter>,
  )

const small = () =>
  setExercises([
    ex('wg-push-up', 'Push-up', ['bodyweight']),
    ex('wg-barbell-row', 'Barbell Row', ['barbell']),
  ])

beforeEach(() => {
  state.catalog.refetch.mockReset()
  small()
})

it('uses the user equipment by default and hides exercises needing more', () => {
  renderPage()
  expect(screen.getByText('Push-up')).toBeInTheDocument()
  expect(screen.queryByText('Barbell Row')).not.toBeInTheDocument()
})

it('shows every exercise when the equipment filter is set to all', async () => {
  renderPage()
  await userEvent.selectOptions(screen.getByLabelText('Equipment'), 'all')
  expect(screen.getByText('Barbell Row')).toBeInTheDocument()
})

it('narrows results as you type', async () => {
  renderPage()
  await userEvent.selectOptions(screen.getByLabelText('Equipment'), 'all')
  await userEvent.type(screen.getByLabelText('Search exercises'), 'push up')
  expect(screen.getByText('Push-up')).toBeInTheDocument()
  expect(screen.queryByText('Barbell Row')).not.toBeInTheDocument()
})

it('shows an empty state and clears filters to bring the list back', async () => {
  renderPage()
  await userEvent.type(screen.getByLabelText('Search exercises'), 'zzzz')
  expect(
    screen.getByText('No exercises match your filters.'),
  ).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
  expect(screen.getByText('Push-up')).toBeInTheDocument()
  expect(screen.getByText('Barbell Row')).toBeInTheDocument()
})

it('renders 40 results and the rest after "Show more"', async () => {
  setExercises(
    Array.from({ length: 45 }, (_, i) =>
      ex(`wg-m${i}`, `Move ${String(i).padStart(2, '0')}`, ['bodyweight']),
    ),
  )
  renderPage()
  expect(within(screen.getByRole('list')).getAllByRole('link')).toHaveLength(40)
  await userEvent.click(screen.getByRole('button', { name: 'Show more' }))
  expect(within(screen.getByRole('list')).getAllByRole('link')).toHaveLength(45)
  expect(
    screen.queryByRole('button', { name: 'Show more' }),
  ).not.toBeInTheDocument()
})

it('shows a loading state', () => {
  state.catalog.data = undefined
  state.catalog.isPending = true
  renderPage()
  expect(screen.getByText('Loading exercises…')).toBeInTheDocument()
})

it('shows an error with a retry button', async () => {
  state.catalog.data = undefined
  state.catalog.isPending = false
  state.catalog.isError = true
  renderPage()
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(state.catalog.refetch).toHaveBeenCalled()
})

it('links each exercise to its detail page', () => {
  renderPage()
  expect(screen.getByRole('link', { name: /Push-up/ })).toHaveAttribute(
    'href',
    '/library/wg-push-up',
  )
})
