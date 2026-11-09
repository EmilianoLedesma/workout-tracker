import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AuthContext } from '@/features/auth/useSession'
import SettingsPage from './SettingsPage'

vi.mock('./EquipmentSettings', () => ({ EquipmentSettings: () => null }))

it('links to the credits screen', () => {
  render(
    <AuthContext
      value={{ session: null, loading: false, signOut: async () => {} }}
    >
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </AuthContext>,
  )
  expect(screen.getByRole('link', { name: 'Credits' })).toHaveAttribute(
    'href',
    '/credits',
  )
})
