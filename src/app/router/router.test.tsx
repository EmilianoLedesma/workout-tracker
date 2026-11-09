import { render, screen } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AuthContext } from '@/features/auth/useSession'
import { routes } from './index'

// The Library page loads data; routing is all this test cares about.
vi.mock('@/features/exercises/useCatalog', () => ({
  useCatalog: () => ({
    data: undefined,
    isPending: true,
    isError: false,
    refetch: () => {},
  }),
}))
vi.mock('@/features/settings/useSettings', () => ({
  useSettings: () => ({
    settings: { weeklyGoal: 3, equipment: [], theme: 'system' },
    isLoading: false,
    error: null,
  }),
}))

const renderAt = (path: string) =>
  render(
    <AuthContext
      value={{
        session: {} as Session,
        loading: false,
        signOut: async () => {},
      }}
    >
      <RouterProvider
        router={createMemoryRouter(routes, { initialEntries: [path] })}
      />
    </AuthContext>,
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
