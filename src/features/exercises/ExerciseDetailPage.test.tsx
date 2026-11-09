import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { Exercise, Provenance } from '@/types/exercise'
import ExerciseDetailPage from './ExerciseDetailPage'

const state = vi.hoisted(() => ({
  value: undefined as unknown,
}))

vi.mock('./useCatalog', () => ({ useExercise: () => state.value }))

const wg: Provenance = {
  source: 'workout-guide',
  license: 'MIT',
  author: 'Bryl Lim',
}

const frame = (n: number) => ({
  src: `/exercises/wg/plank/frame-${n}.png`,
  width: 512,
  height: 512,
  creator: 'Bryl Lim',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  ...(n === 1 && {
    sourceUrl: 'https://github.com/everkinetic/data',
    changes: 'Rasterized and recolored.',
  }),
})

const base = (over: Partial<Exercise> = {}): Exercise =>
  ({
    id: 'wg-plank',
    name: 'Plank',
    aliases: [],
    primaryMuscle: 'core',
    secondaryMuscles: ['shoulders'],
    equipment: ['bodyweight'],
    exerciseType: 'duration',
    level: 'beginner',
    category: 'strength',
    isStretch: false,
    description: null,
    instructions: ['Hold a straight line.', 'Breathe steadily.'],
    frames: [frame(1), frame(2), frame(3)],
    provenance: {
      identity: wg,
      muscles: wg,
      equipment: wg,
      level: { source: 'free-exercise-db', license: 'Unlicense' },
      instructions: { source: 'free-exercise-db', license: 'Unlicense' },
      frames: { ...wg, license: 'CC BY-SA 4.0' },
    },
    reviewStatus: 'unreviewed',
    deprecated: false,
    mergedFrom: [],
    ...over,
  }) as Exercise

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/library/wg-plank']}>
      <Routes>
        <Route path="library/:exerciseId" element={<ExerciseDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )

it('shows the name, three illustrations and the instructions', () => {
  state.value = base()
  renderPage()
  expect(screen.getByRole('heading', { name: 'Plank' })).toBeInTheDocument()
  expect(screen.getAllByRole('img')).toHaveLength(3)
  expect(
    screen.getByRole('img', { name: 'Plank, position 2 of 3' }),
  ).toBeInTheDocument()
  expect(screen.getByText('Hold a straight line.')).toBeInTheDocument()
  expect(screen.getByText('Beginner')).toBeInTheDocument()
})

it('shows no level badge when no source states a level', () => {
  state.value = base({ level: null })
  renderPage()
  expect(screen.queryByText(/beginner|intermediate|expert/i)).toBeNull()
})

it('says instructions are not available when there are none', () => {
  state.value = base({ instructions: [] })
  renderPage()
  expect(
    screen.getByText('Instructions not available yet.'),
  ).toBeInTheDocument()
})

it('shows a placeholder instead of frames for a text-only exercise', () => {
  state.value = base({ frames: [] })
  renderPage()
  expect(screen.getByText('No illustration')).toBeInTheDocument()
  expect(screen.queryAllByRole('img')).toHaveLength(0)
})

it('says equipment is not specified when unknown', () => {
  state.value = base({ equipment: [] })
  renderPage()
  expect(screen.getByText(/Equipment not specified/)).toBeInTheDocument()
})

it('shows a not-found state with a link back to the library', () => {
  state.value = undefined
  renderPage()
  expect(screen.getByText('Exercise not found.')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to library' })).toHaveAttribute(
    'href',
    '/library',
  )
})

it('shows a loading state', () => {
  state.value = 'loading'
  renderPage()
  expect(screen.getByRole('status')).toHaveTextContent('Loading exercise…')
})

it('lists the illustration creator, license, source and changes', () => {
  state.value = base()
  renderPage()
  const block = screen.getByRole('region', { name: 'Sources and license' })
  expect(block).toHaveTextContent('Bryl Lim')
  expect(block).toHaveTextContent('CC BY-SA 4.0')
  expect(block).toHaveTextContent('Rasterized and recolored.')
  expect(block.querySelector('a')).toHaveAttribute(
    'href',
    'https://github.com/everkinetic/data',
  )
})

it('marks project-authored exercises as unreviewed', () => {
  const project: Provenance = {
    source: 'project',
    license: 'MIT (this project)',
  }
  state.value = base({
    frames: [],
    provenance: {
      identity: project,
      muscles: project,
      equipment: project,
      level: null,
      instructions: project,
      frames: null,
    },
  })
  renderPage()
  expect(screen.getByText('Project-authored')).toBeInTheDocument()
  expect(screen.getByText('Unreviewed')).toBeInTheDocument()
})
