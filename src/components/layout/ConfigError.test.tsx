import { render, screen } from '@testing-library/react'
import { ConfigError } from './ConfigError'

it('names each missing variable and points to .env.example', () => {
  render(<ConfigError missing={['VITE_SUPABASE_URL', 'OTHER_VAR']} />)
  expect(screen.getByText('VITE_SUPABASE_URL')).toBeInTheDocument()
  expect(screen.getByText('OTHER_VAR')).toBeInTheDocument()
  expect(screen.getByText(/\.env\.example/)).toBeInTheDocument()
})
