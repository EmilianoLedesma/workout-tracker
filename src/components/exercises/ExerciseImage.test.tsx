import { fireEvent, render, screen } from '@testing-library/react'
import type { Frame } from '@/types/exercise'
import { ExerciseImage } from './ExerciseImage'

const frame: Frame = {
  src: '/exercises/wg/plank/frame-1.png',
  width: 512,
  height: 512,
  creator: 'Bryl Lim',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
}

it('renders a lazy-loaded image with the given alt text', () => {
  render(<ExerciseImage frame={frame} alt="Plank, position 1 of 3" />)
  const img = screen.getByRole('img', { name: 'Plank, position 1 of 3' })
  expect(img).toHaveAttribute('src', frame.src)
  expect(img).toHaveAttribute('loading', 'lazy')
})

it('shows a placeholder when there is no frame', () => {
  render(<ExerciseImage alt="Plank" />)
  expect(screen.getByText('No illustration')).toBeInTheDocument()
})

it('falls back to the placeholder when the image fails to load', () => {
  render(<ExerciseImage frame={frame} alt="Plank" />)
  fireEvent.error(screen.getByRole('img', { name: 'Plank' }))
  expect(screen.getByText('No illustration')).toBeInTheDocument()
})
