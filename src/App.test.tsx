import { render, screen } from '@testing-library/react'
import App from './App'

afterEach(() => vi.unstubAllEnvs())

it('renders the app name when env is configured', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_x')
  render(<App />)
  expect(await screen.findByText('Workout Tracker')).toBeInTheDocument()
})

it('shows the configuration error when env is missing', () => {
  vi.stubEnv('VITE_SUPABASE_URL', '')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')
  render(<App />)
  expect(
    screen.getByRole('heading', { name: 'Configuration missing' }),
  ).toBeInTheDocument()
})
