import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { Exercise } from '@/types/exercise'
import type { Routine } from '@/types/routine'
import RoutineEditorPage from './RoutineEditorPage'

const ex = (id: string, name: string, exerciseType = 'reps') =>
  ({
    id,
    name,
    aliases: [],
    primaryMuscle: null,
    secondaryMuscles: [],
    equipment: ['bodyweight'],
    exerciseType,
    level: null,
    category: null,
    isStretch: false,
    description: null,
    instructions: [],
    frames: [],
    reviewStatus: 'unreviewed',
    deprecated: false,
    mergedFrom: [],
  }) as unknown as Exercise

const state = vi.hoisted(() => ({
  routine: undefined as Routine | null | undefined,
  saveAsync: vi.fn(),
  catalog: {} as { data?: { exercises: unknown[] }; isPending: boolean; isError: boolean },
}))

vi.mock('./useRoutines', () => ({
  useRoutine: () => ({ routine: state.routine, isLoading: false, error: null }),
  useSaveRoutine: () => ({ mutateAsync: state.saveAsync }),
}))
vi.mock('@/features/exercises/useCatalog', () => ({
  useCatalog: () => state.catalog,
}))
vi.mock('@/features/settings/useSettings', () => ({
  useSettings: () => ({ settings: { equipment: ['bodyweight'] } }),
}))

const item = (exerciseId: string) => ({
  exerciseId,
  sets: 2,
  targetType: 'reps' as const,
  target: 8,
  restSeconds: 60,
})

const existing: Routine = {
  id: 'r1',
  name: 'Mine',
  dayLabel: 'B',
  isStarter: false,
  items: [item('wg-push-up'), item('wg-squat')],
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/routines" element={<p>ROUTINES LIST</p>} />
        <Route path="/routines/new" element={<RoutineEditorPage />} />
        <Route path="/routines/:routineId" element={<RoutineEditorPage />} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  state.catalog = {
    data: { exercises: [ex('wg-push-up', 'Push-up'), ex('wg-squat', 'Squat')] },
    isPending: false,
    isError: false,
  }
  state.routine = existing
  state.saveAsync.mockReset()
  state.saveAsync.mockResolvedValue('r1')
})

describe('new routine', () => {
  it('starts empty, then saves a name and an added exercise', async () => {
    renderAt('/routines/new')
    expect(
      screen.getByRole('heading', { name: 'New routine' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByText('No exercises yet')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Name'), 'Mine')
    await userEvent.click(screen.getByRole('button', { name: 'Add Push-up' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(state.saveAsync).toHaveBeenCalledWith({
      id: null,
      draft: { name: 'Mine', dayLabel: null, items: [item('wg-push-up')] },
    })
    expect(await screen.findByText('ROUTINES LIST')).toBeInTheDocument()
  })
})

describe('editing', () => {
  it('loads the routine into the form', () => {
    renderAt('/routines/r1')
    expect(screen.getByLabelText('Name')).toHaveValue('Mine')
    expect(screen.getByLabelText('Day label')).toHaveValue('B')
    expect(screen.getByLabelText('Sets for Push-up')).toHaveValue('2')
  })

  it('reorders with the move buttons and disables them at the ends', async () => {
    renderAt('/routines/r1')
    expect(
      screen.getByRole('button', { name: 'Move Push-up up' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Move Squat down' }),
    ).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Move Squat up' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(
      state.saveAsync.mock.calls[0][0].draft.items.map(
        (i: { exerciseId: string }) => i.exerciseId,
      ),
    ).toEqual(['wg-squat', 'wg-push-up'])
  })

  it('keeps focus on the moved row', async () => {
    renderAt('/routines/r1')
    await userEvent.click(screen.getByRole('button', { name: 'Move Squat up' }))
    // Squat is first now, so its up button is disabled; focus goes to its down button.
    expect(screen.getByRole('button', { name: 'Move Squat down' })).toHaveFocus()
  })

  it('removes an exercise', async () => {
    renderAt('/routines/r1')
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Push-up' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(state.saveAsync.mock.calls[0][0].draft.items).toEqual([
      item('wg-squat'),
    ])
  })

  it('saves changed sets', async () => {
    renderAt('/routines/r1')
    const sets = screen.getByLabelText('Sets for Push-up')
    await userEvent.clear(sets)
    await userEvent.type(sets, '3')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(state.saveAsync.mock.calls[0][0].id).toBe('r1')
    expect(state.saveAsync.mock.calls[0][0].draft.items[0].sets).toBe(3)
  })

  it('shows a loading status while the routine loads', () => {
    state.routine = undefined
    renderAt('/routines/r1')
    expect(screen.getByRole('status')).toHaveTextContent('Loading routine…')
  })

  it('says when the routine does not exist', () => {
    state.routine = null
    renderAt('/routines/nope')
    expect(screen.getByText('Routine not found')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Back to routines' }),
    ).toHaveAttribute('href', '/routines')
  })
})

describe('validation', () => {
  it('blocks a blank name and says so', async () => {
    renderAt('/routines/new')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(state.saveAsync).not.toHaveBeenCalled()
  })

  it('blocks zero sets next to the field', async () => {
    renderAt('/routines/r1')
    const sets = screen.getByLabelText('Sets for Push-up')
    await userEvent.clear(sets)
    await userEvent.type(sets, '0')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Sets must be 1 to 10')).toBeInTheDocument()
    expect(state.saveAsync).not.toHaveBeenCalled()
  })

  it('blocks reps above 100', async () => {
    renderAt('/routines/r1')
    const reps = screen.getByLabelText('Reps for Push-up')
    await userEvent.clear(reps)
    await userEvent.type(reps, '101')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Reps must be 1 to 100')).toBeInTheDocument()
    expect(state.saveAsync).not.toHaveBeenCalled()
  })
})

describe('validation accessibility', () => {
  it('marks the wrong field, links its message and moves focus to it', async () => {
    renderAt('/routines/r1')
    const reps = screen.getByLabelText('Reps for Push-up')
    await userEvent.clear(reps)
    await userEvent.type(reps, '101')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(reps).toHaveFocus()
    expect(reps).toHaveAttribute('aria-invalid', 'true')
    expect(reps).toHaveAccessibleDescription('Reps must be 1 to 100')
    expect(screen.getByLabelText('Sets for Push-up')).not.toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('links the name message to the name field and focuses it', async () => {
    renderAt('/routines/new')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    const name = screen.getByLabelText('Name')
    expect(name).toHaveFocus()
    expect(name).toHaveAccessibleDescription('Name is required')
  })
})

describe('failures', () => {
  it('keeps the draft, shows a plain error and retries', async () => {
    state.saveAsync.mockRejectedValueOnce(new Error('JWT expired: internals'))
    renderAt('/routines/r1')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'Could not save. Check your connection and try again.',
    )
    expect(alert).not.toHaveTextContent('JWT')
    expect(screen.getByLabelText('Name')).toHaveValue('Mine')

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(state.saveAsync).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('ROUTINES LIST')).toBeInTheDocument()
  })

  it('does not call exercises unavailable while the catalog loads', () => {
    state.catalog = { data: undefined, isPending: true, isError: false }
    renderAt('/routines/r1')
    expect(screen.queryByText('Exercise no longer available')).toBeNull()
  })

  it('says so when the catalog cannot load', () => {
    state.catalog = { data: undefined, isPending: false, isError: true }
    renderAt('/routines/r1')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load the exercise list.',
    )
    expect(screen.queryByText('No exercises found')).toBeNull()
    expect(screen.queryByText('Exercise no longer available')).toBeNull()
  })

  describe('an exercise that is gone from the catalog', () => {
    beforeEach(() => {
      state.routine = {
        ...existing,
        items: [item('wg-retired'), item('wg-squat')],
      }
    })

    it('stays in the routine and is saved unchanged', async () => {
      renderAt('/routines/r1')
      const row = screen
        .getByText('Exercise no longer available')
        .closest('li')!
      expect(within(row).getByText('wg-retired')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      expect(state.saveAsync.mock.calls[0][0].draft.items[0].exerciseId).toBe(
        'wg-retired',
      )
    })

    it('can still be removed', async () => {
      renderAt('/routines/r1')
      await userEvent.click(
        screen.getByRole('button', { name: 'Remove wg-retired' }),
      )
      expect(screen.queryByText('Exercise no longer available')).toBeNull()
    })
  })
})
