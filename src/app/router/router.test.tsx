import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AuthContext } from '@/features/auth/useSession'
import { routes } from './index'

// Pages load data; routing and access rules are all this test cares about.
vi.mock('@/features/exercises/useCatalog', () => ({
  useCatalog: () => ({
    data: undefined,
    isPending: true,
    isError: false,
    refetch: () => {},
  }),
  useExercise: () => 'loading',
}))
vi.mock('@/features/settings/useSettings', () => ({
  useSettings: () => ({
    settings: { weeklyGoal: 3, equipment: [], theme: 'system' },
    isLoading: false,
    error: null,
  }),
}))
vi.mock('@/lib/catalog/loadCredits', () => ({
  loadCredits: () => new Promise(() => {}),
}))

const signedIn = {} as Session

const renderAt = (path: string, session: Session | null = signedIn) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthContext value={{ session, loading: false, signOut: async () => {} }}>
        <RouterProvider
          router={createMemoryRouter(routes, { initialEntries: [path] })}
        />
      </AuthContext>
    </QueryClientProvider>,
  )

it('renders the Library page at /library', () => {
  renderAt('/library')
  expect(screen.getByRole('heading', { name: 'Library' })).toBeInTheDocument()
})

it('renders NotFound for unknown routes', () => {
  renderAt('/nope')
  expect(
    screen.getByRole('heading', { name: 'Page not found' }),
  ).toBeInTheDocument()
})

describe('signed out', () => {
  it('can browse the Library without signing in', () => {
    renderAt('/library', null)
    expect(screen.getByRole('heading', { name: 'Library' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('can open an exercise detail page without signing in', () => {
    renderAt('/library/wg-plank', null)
    expect(screen.getByRole('status')).toHaveTextContent('Loading exercise…')
  })

  it('can open Credits without signing in', () => {
    renderAt('/credits', null)
    expect(screen.getByRole('heading', { name: 'Credits' })).toBeInTheDocument()
  })

  it('is sent to the login page for personal pages', () => {
    renderAt('/routines', null)
    expect(
      screen.getByRole('button', { name: 'Send magic link' }),
    ).toBeInTheDocument()
  })
})

it('does not show the Sign in link when signed in', () => {
  renderAt('/library')
  expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull()
})

describe('home route', () => {
  it('shows the landing page when signed out', () => {
    renderAt('/', null)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Show up. Three a week.' }),
    ).toBeInTheDocument()
  })

  it('shows the Dashboard when signed in', () => {
    renderAt('/')
    expect(
      screen.getByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Show up.', { exact: false })).toBeNull()
  })
})

describe('credits link', () => {
  it.each([
    ['signed out', null],
    ['signed in', signedIn],
  ])('is in the shared footer when %s', (_label, session) => {
    renderAt('/library', session)
    expect(screen.getByRole('link', { name: 'Credits' })).toHaveAttribute(
      'href',
      '/credits',
    )
  })
})
