import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { AuthContext } from '@/features/auth/useSession'
import { EquipmentSettings } from './EquipmentSettings'

const mocks = vi.hoisted(() => ({ maybeSingle: vi.fn(), upsert: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }),
      upsert: mocks.upsert,
    }),
  }),
}))

const session = { user: { id: 'u1' } } as Session

const renderIt = () =>
  render(
    <AuthContext value={{ session, loading: false, signOut: async () => {} }}>
      <QueryClientProvider client={new QueryClient()}>
        <EquipmentSettings />
      </QueryClientProvider>
    </AuthContext>,
  )

beforeEach(() => {
  mocks.maybeSingle.mockReset()
  mocks.upsert.mockReset()
  mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
})

it('shows the default equipment as checked', async () => {
  renderIt()
  expect(await screen.findByRole('checkbox', { name: 'Chair' })).toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Barbell' })).not.toBeChecked()
})

it('saves the remaining items when an item is unchecked', async () => {
  mocks.upsert.mockResolvedValue({ error: null })
  renderIt()
  await userEvent.click(await screen.findByRole('checkbox', { name: 'Chair' }))
  expect(mocks.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ equipment: ['bodyweight', 'wall'] }),
    { onConflict: 'user_id' },
  )
})

it('updates the checkbox immediately and keeps rapid toggles', async () => {
  mocks.upsert.mockImplementation(() => new Promise(() => {})) // save never finishes
  renderIt()
  const chair = await screen.findByRole('checkbox', { name: 'Chair' })
  await userEvent.click(chair)
  expect(chair).not.toBeChecked()
  await userEvent.click(screen.getByRole('checkbox', { name: 'Wall' }))
  expect(mocks.upsert).toHaveBeenLastCalledWith(
    expect.objectContaining({ equipment: ['bodyweight'] }),
    { onConflict: 'user_id' },
  )
})

it('shows an error and keeps the checkbox as it was when saving fails', async () => {
  mocks.upsert.mockResolvedValue({ error: { message: 'nope' } })
  renderIt()
  await userEvent.click(await screen.findByRole('checkbox', { name: 'Chair' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not save your equipment',
  )
  expect(screen.getByRole('checkbox', { name: 'Chair' })).toBeChecked()
})
