import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { BottomNav } from './BottomNav'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <BottomNav />
    </MemoryRouter>,
  )

it('renders five links with accessible names', () => {
  renderAt('/')
  const names = screen.getAllByRole('link').map((l) => l.textContent)
  expect(names).toEqual(['Home', 'Library', 'Routines', 'Progress', 'Settings'])
})

it('marks the current route as active (aria-current=page)', () => {
  renderAt('/library')
  expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
    'aria-current',
  )
})
