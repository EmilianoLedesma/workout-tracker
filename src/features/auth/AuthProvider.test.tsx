import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './AuthProvider'
import { useSession } from './useSession'

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), getSession: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signOut: mocks.signOut,
    },
  }),
}))

function SignOutButton() {
  const { signOut } = useSession()
  return <button onClick={() => signOut().catch(() => {})}>out</button>
}

function Status() {
  const { loading } = useSession()
  return <p>{loading ? 'loading' : 'ready'}</p>
}

const renderWith = (client: QueryClient, ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>{ui}</AuthProvider>
    </QueryClientProvider>,
  )

beforeEach(() => {
  mocks.signOut.mockReset()
  mocks.getSession.mockReset()
  mocks.getSession.mockResolvedValue({ data: { session: null } })
})

it('signOut clears the React Query cache', async () => {
  mocks.signOut.mockResolvedValue({ error: null })
  const client = new QueryClient()
  client.setQueryData(['secret'], 'cached')
  renderWith(client, <SignOutButton />)
  await userEvent.click(screen.getByText('out'))
  expect(mocks.signOut).toHaveBeenCalled()
  expect(client.getQueryData(['secret'])).toBeUndefined()
})

it('clears the cache even when signOut rejects', async () => {
  mocks.signOut.mockRejectedValue(new Error('offline'))
  const client = new QueryClient()
  client.setQueryData(['secret'], 'cached')
  renderWith(client, <SignOutButton />)
  await userEvent.click(screen.getByText('out'))
  expect(client.getQueryData(['secret'])).toBeUndefined()
})

it('stops loading when getSession rejects', async () => {
  mocks.getSession.mockRejectedValue(new Error('storage blocked'))
  renderWith(new QueryClient(), <Status />)
  expect(await screen.findByText('ready')).toBeInTheDocument()
})
