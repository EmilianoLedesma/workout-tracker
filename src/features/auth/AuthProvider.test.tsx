import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './AuthProvider'
import { useSession } from './useSession'

const mocks = vi.hoisted(() => ({ signOut: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signOut: mocks.signOut,
    },
  }),
}))

function SignOutButton() {
  const { signOut } = useSession()
  return <button onClick={signOut}>out</button>
}

it('signOut clears the React Query cache', async () => {
  mocks.signOut.mockResolvedValue({ error: null })
  const client = new QueryClient()
  client.setQueryData(['secret'], 'cached')
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <SignOutButton />
      </AuthProvider>
    </QueryClientProvider>,
  )
  await userEvent.click(screen.getByText('out'))
  expect(mocks.signOut).toHaveBeenCalled()
  expect(client.getQueryData(['secret'])).toBeUndefined()
})
