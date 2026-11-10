import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import LandingPage from './LandingPage'

const renderLanding = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )

it('leads with the weekly rhythm headline', () => {
  renderLanding()
  expect(
    screen.getByRole('heading', { level: 1, name: 'Show up. Three a week.' }),
  ).toBeInTheDocument()
})

it('sends visitors to the public exercise library', () => {
  renderLanding()
  expect(
    screen.getByRole('link', { name: 'Browse exercises' }),
  ).toHaveAttribute('href', '/library')
})

it('offers sign-in to track weeks', () => {
  renderLanding()
  expect(
    screen.getByRole('link', { name: 'Sign in to track your weeks' }),
  ).toHaveAttribute('href', '/login')
})

it('hides the decorative week strip from assistive tech', () => {
  renderLanding()
  const strip = screen.getByTestId('week-strip')
  expect(strip).toHaveAttribute('aria-hidden', 'true')
  expect(strip.children).toHaveLength(7)
})

it('labels each tally cell with its weekday initial', () => {
  renderLanding()
  expect(screen.getByTestId('week-strip')).toHaveTextContent('MTWTFSS')
})

it('explains how it works in three steps', () => {
  renderLanding()
  expect(
    screen.getByRole('heading', { level: 2, name: 'How it works' }),
  ).toBeInTheDocument()
  const steps = screen.getAllByRole('listitem')
  expect(steps).toHaveLength(3)
  expect(steps[0]).toHaveTextContent('Pick a routine')
  expect(steps[1]).toHaveTextContent('Log each session')
  expect(steps[2]).toHaveTextContent('Watch your weeks stack up')
})

it('says streaks count weeks and stay quiet', () => {
  renderLanding()
  expect(
    screen.getByRole('heading', { level: 2, name: 'Weeks, not days' }),
  ).toBeInTheDocument()
  expect(screen.getByText(/no reminders, no guilt/i)).toBeInTheDocument()
})

it('says exercises follow the equipment you own', () => {
  renderLanding()
  expect(
    screen.getByRole('heading', { level: 2, name: 'Fits what you own' }),
  ).toBeInTheDocument()
})

it('closes with a second route into the library', () => {
  renderLanding()
  expect(
    screen.getByRole('link', { name: 'See the exercise library' }),
  ).toHaveAttribute('href', '/library')
})
