import { render, screen } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { AuthContext } from './useSession'
import { RequireAuth } from './RequireAuth'

function LoginProbe() {
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from
  return <div>login from {from?.pathname}</div>
}

const renderAt = (
  value: { session: Session | null; loading: boolean },
  path = '/routines',
) =>
  render(
    <AuthContext value={{ ...value, signOut: async () => {} }}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route
            path="/routines"
            element={
              <RequireAuth>
                <div>protected</div>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  )

it('redirects to /login and remembers the path when signed out', () => {
  renderAt({ session: null, loading: false })
  expect(screen.getByText('login from /routines')).toBeInTheDocument()
})

it('renders children when a session exists', () => {
  renderAt({ session: {} as Session, loading: false })
  expect(screen.getByText('protected')).toBeInTheDocument()
})

it('shows a loading state while the session is resolving', () => {
  renderAt({ session: null, loading: true })
  expect(screen.getByText('Loading…')).toBeInTheDocument()
  expect(screen.queryByText('protected')).not.toBeInTheDocument()
})
