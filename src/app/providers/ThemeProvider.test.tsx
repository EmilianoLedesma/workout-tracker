import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from './ThemeProvider'
import { useTheme } from '@/hooks/useTheme'

function Probe() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme('dark')}>dark</button>
    </div>
  )
}

const renderProbe = () =>
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  )

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

afterEach(() => vi.restoreAllMocks())

it('adds the dark class when theme is dark', async () => {
  renderProbe()
  await userEvent.click(screen.getByText('dark'))
  expect(document.documentElement).toHaveClass('dark')
})

it('persists the choice in localStorage', async () => {
  renderProbe()
  await userEvent.click(screen.getByText('dark'))
  expect(localStorage.getItem('theme')).toBe('dark')
})

it('does not throw when localStorage access throws', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  renderProbe()
  await userEvent.click(screen.getByText('dark'))
  expect(document.documentElement).toHaveClass('dark')
})
