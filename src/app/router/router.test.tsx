import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { routes } from './index'

const renderAt = (path: string) =>
  render(
    <RouterProvider
      router={createMemoryRouter(routes, { initialEntries: [path] })}
    />,
  )

it('renders the Library page at /library', () => {
  renderAt('/library')
  expect(screen.getByRole('heading', { name: 'Library' })).toBeInTheDocument()
})

it('renders NotFound for unknown routes', () => {
  renderAt('/nope')
  expect(
    screen.getByRole('heading', { name: 'Page not found' }),
  ).toBeInTheDocument()
})
