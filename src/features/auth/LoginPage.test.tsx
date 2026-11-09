import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Session } from '@supabase/supabase-js'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthContext } from './useSession'
import LoginPage from './LoginPage'

const mocks = vi.hoisted(() => ({ signInWithOtp: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({ auth: { signInWithOtp: mocks.signInWithOtp } }),
}))

type Entry = string | { pathname: string; state?: unknown }

const renderLogin = (session: Session | null, entry: Entry = '/login') =>
  render(
    <AuthContext value={{ session, loading: false, signOut: async () => {} }}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/routines" element={<div>ROUTINES</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  )

beforeEach(() => mocks.signInWithOtp.mockReset())

it('sends a magic link for a valid email and shows a check-your-email message', async () => {
  mocks.signInWithOtp.mockResolvedValue({ error: null })
  renderLogin(null)
  await userEvent.type(screen.getByLabelText('Email'), 'me@example.com')
  await userEvent.click(screen.getByRole('button', { name: 'Send magic link' }))
  expect(mocks.signInWithOtp).toHaveBeenCalledWith({
    email: 'me@example.com',
    options: { emailRedirectTo: window.location.origin + '/' },
  })
  expect(await screen.findByText(/Check your email/)).toBeInTheDocument()
})

it('shows the error and allows retry when signInWithOtp fails', async () => {
  mocks.signInWithOtp.mockResolvedValue({ error: { message: 'rate limited' } })
  renderLogin(null)
  await userEvent.type(screen.getByLabelText('Email'), 'me@example.com')
  await userEvent.click(screen.getByRole('button', { name: 'Send magic link' }))
  expect(await screen.findByText('rate limited')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Send magic link' }))
  expect(mocks.signInWithOtp).toHaveBeenCalledTimes(2)
})

it('rejects an empty or invalid email without calling Supabase', async () => {
  renderLogin(null)
  await userEvent.type(screen.getByLabelText('Email'), 'nope')
  await userEvent.click(screen.getByRole('button', { name: 'Send magic link' }))
  expect(await screen.findByText('Enter a valid email')).toBeInTheDocument()
  expect(mocks.signInWithOtp).not.toHaveBeenCalled()
})

it('returns to the remembered path after a session appears', () => {
  renderLogin({} as Session, {
    pathname: '/login',
    state: { from: { pathname: '/routines', search: '' } },
  })
  expect(screen.getByText('ROUTINES')).toBeInTheDocument()
})

it('shows the link error from the URL hash', () => {
  renderLogin(
    null,
    '/login#error_description=Email+link+is+invalid+or+has+expired',
  )
  expect(
    screen.getByText('Email link is invalid or has expired'),
  ).toBeInTheDocument()
})
