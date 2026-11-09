import { render, screen } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AuthContext } from '@/features/auth/useSession'
import { routes } from './index'

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
