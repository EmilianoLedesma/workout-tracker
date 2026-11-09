import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Credits } from '@/types/credits'
import CreditsPage from './CreditsPage'

const credits: Credits = {
  sources: [
    {
      name: 'Workout Guide',
      url: 'https://github.com/bryllim/workout-guide',
      license: 'Code MIT, illustrations CC BY-SA 4.0',
      note: 'Exercise metadata and illustrations.',
    },
  ],
  frames: [
    {
      exerciseId: 'wg-wall-sit',
      creator: 'Bryl Lim',
      license: 'CC BY-SA 4.0',
      sourceUrl: 'https://github.com/everkinetic/data',
      changes: 'Rasterized and recolored.',
    },
  ],
}

const state = vi.hoisted(() => ({ fail: false }))

vi.mock('@/lib/catalog/loadCredits', () => ({
  loadCredits: async () => {
    if (state.fail) throw new Error('boom')
    return credits
  },
}))

const renderPage = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <CreditsPage />
    </QueryClientProvider>,
  )

beforeEach(() => {
  state.fail = false
})

it('lists each source with its license and note', async () => {
  renderPage()
  expect(
    await screen.findByText('Code MIT, illustrations CC BY-SA 4.0'),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Workout Guide' })).toHaveAttribute(
    'href',
    'https://github.com/bryllim/workout-guide',
  )
})

it('states that the app is not medical advice', async () => {
  renderPage()
  expect(await screen.findByText(/not medical advice/i)).toBeInTheDocument()
})

it('lists illustration attributions with creator, license, source and changes', async () => {
  renderPage()
  const item = await screen.findByText(/Wall sit/)
  const row = item.closest('li')!
  expect(row).toHaveTextContent('Bryl Lim')
  expect(row).toHaveTextContent('CC BY-SA 4.0')
  expect(row).toHaveTextContent('Rasterized and recolored.')
  expect(row.querySelector('a')).toHaveAttribute(
    'href',
    'https://github.com/everkinetic/data',
  )
})

it('shows an error when credits cannot be loaded', async () => {
  state.fail = true
  renderPage()
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not load credits.',
  )
})
