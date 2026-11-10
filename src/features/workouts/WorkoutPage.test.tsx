import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { Exercise } from '@/types/exercise'
import type { Routine } from '@/types/routine'
import type { Workout } from '@/types/workout'
import WorkoutPage from './WorkoutPage'
import { createWorkout, reduce } from './workoutState'

const ex = (id: string, name: string) =>
  ({
    id,
    name,
    aliases: [],
    primaryMuscle: null,
    secondaryMuscles: [],
    equipment: ['bodyweight'],
    exerciseType: 'reps',
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

const routine: Routine = {
  id: 'r1',
  name: 'Mine',
  dayLabel: null,
  isStarter: false,
  items: [
    {
      exerciseId: 'wall-push-up',
      sets: 1,
      targetType: 'reps',
      target: 8,
      restSeconds: 60,
    },
    {
      exerciseId: 'squat',
      sets: 1,
      targetType: 'reps',
      target: 8,
      restSeconds: 60,
    },
  ],
}

const state = vi.hoisted(() => ({
  routine: undefined as unknown,
  routineError: null as Error | null,
  session: {} as Record<string, unknown>,
}))

const makeSession = (over: Record<string, unknown> = {}) => ({
  workout: null as Workout | null,
  now: Date.now(),
  start: vi.fn(),
  act: vi.fn(),
  discard: vi.fn(),
  save: { status: 'idle', retry: vi.fn() },
  summary: null,
  ...over,
})
const session = () => state.session as ReturnType<typeof makeSession>

vi.mock('./useWorkoutSession', () => ({
  useWorkoutSession: () => state.session,
}))
vi.mock('./alerts', () => ({ prepareAudio: vi.fn() }))
vi.mock('@/features/routines/useRoutines', () => ({
  useRoutine: () => ({
    routine: state.routine,
    isLoading: state.routine === undefined,
    error: state.routineError,
  }),
}))
vi.mock('@/features/exercises/useCatalog', () => ({
  useCatalog: () => ({
    data: {
      exercises: [ex('wall-push-up', 'Wall push-up'), ex('squat', 'Squat')],
    },
    isPending: false,
  }),
}))
vi.mock('@/features/settings/useSettings', () => ({
  useSettings: () => ({ settings: { equipment: ['bodyweight'] } }),
}))

const fresh = (r: Routine = routine) =>
  createWorkout({
    id: 'w1',
    routine: r,
    now: Date.now(),
    uid: () => 'u' + Math.random(),
  })

const renderPage = (path = '/workout/r1') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/workout/:routineId" element={<WorkoutPage />} />
        <Route path="/routines" element={<p>ROUTINES LIST</p>} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  state.routine = routine
  state.routineError = null
  state.session = makeSession()
})

describe('starting', () => {
  it('shows a loading status while the routine loads', () => {
    state.routine = undefined
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('Loading routine…')
  })

  it('shows an error when the routine cannot load', () => {
    state.routine = undefined
    state.routineError = new Error('x')
    renderPage()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load this routine.',
    )
  })

  it('says when the routine does not exist', () => {
    state.routine = null
    renderPage()
    expect(screen.getByText('Routine not found')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Back to routines' }),
    ).toHaveAttribute('href', '/routines')
  })

  it('starts the routine once when there is no draft', () => {
    renderPage()
    expect(session().start).toHaveBeenCalledTimes(1)
    expect(session().start).toHaveBeenCalledWith(routine)
  })
})

describe('an unfinished workout', () => {
  it('continues a recent draft of the same routine without asking', () => {
    state.session = makeSession({ workout: fresh() })
    renderPage()
    expect(
      screen.getByRole('heading', { name: 'Wall push-up' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull()
    expect(session().start).not.toHaveBeenCalled()
  })

  it('still runs after the routine was deleted', () => {
    state.routine = null
    state.session = makeSession({ workout: fresh() })
    renderPage()
    expect(screen.queryByText('Routine not found')).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'Wall push-up' }),
    ).toBeInTheDocument()
  })

  it('asks before replacing a draft of another routine', async () => {
    const other = { ...fresh(), routineId: 'r9', routineName: 'Other' }
    state.session = makeSession({ workout: other })
    renderPage()
    expect(screen.getByText(/Other/)).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Discard and start new' }),
    )
    expect(session().discard).toHaveBeenCalled()
  })

  it('asks when the draft is more than a day old', () => {
    const old = { ...fresh(), updatedAt: Date.now() - 25 * 3600 * 1000 }
    state.session = makeSession({ workout: old })
    renderPage()
    expect(screen.getByText(/more than a day ago/i)).toBeInTheDocument()
  })
})

describe('during the workout', () => {
  it('shows the rest screen while resting', () => {
    const resting = reduce(fresh(), { type: 'completeSet', now: Date.now() })
    state.session = makeSession({ workout: resting })
    renderPage()
    expect(screen.getByRole('timer')).toBeInTheDocument()
    expect(screen.getByText('Squat')).toBeInTheDocument()
  })

  it('pauses and resumes', async () => {
    state.session = makeSession({ workout: fresh() })
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(session().act).toHaveBeenLastCalledWith({ type: 'pause' })

    state.session = makeSession({
      workout: reduce(fresh(), { type: 'pause', now: Date.now() }),
    })
    renderPage()
    expect(screen.getByText(/Paused/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Resume' }))
    expect(session().act).toHaveBeenLastCalledWith({ type: 'resume' })
  })

  it("opens today's plan and finishes early from it", async () => {
    state.session = makeSession({ workout: fresh() })
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Plan' }))
    expect(
      screen.getByRole('region', { name: "Today's plan" }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Finish early' }))
    expect(
      screen.getByRole('button', { name: 'Save workout' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: "Today's plan" })).toBeNull()
  })

  it('offers Finish when every set is done and sends the note', async () => {
    let w = fresh()
    const t = Date.now()
    w = reduce(w, { type: 'completeSet', now: t })
    w = reduce(w, { type: 'endRest', now: t + 1000 })
    w = reduce(w, { type: 'completeSet', now: t + 2000 })
    expect(w.phase).toBe('review')
    state.session = makeSession({ workout: w })
    renderPage()
    expect(screen.getByText('All sets done')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }))
    await userEvent.type(screen.getByLabelText('Note (optional)'), 'good')
    await userEvent.click(screen.getByRole('button', { name: 'Save workout' }))
    expect(session().act).toHaveBeenLastCalledWith({
      type: 'finish',
      note: 'good',
    })
  })
})

describe('after finishing', () => {
  it('shows saving for a finished workout still on the phone', () => {
    const done = reduce(fresh(), { type: 'finish', note: '', now: Date.now() })
    state.session = makeSession({
      workout: done,
      save: { status: 'saving', retry: vi.fn() },
    })
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('Saving…')
  })

  it('shows the saved summary', () => {
    state.session = makeSession({
      workout: null,
      save: { status: 'saved', retry: vi.fn() },
      summary: {
        id: 'w1',
        routineId: 'r1',
        routineName: 'Mine',
        startedAt: new Date(0).toISOString(),
        finishedAt: new Date(600000).toISOString(),
        durationSeconds: 600,
        status: 'completed',
        note: null,
        log: [],
      },
    })
    renderPage()
    expect(screen.getByText('Workout saved')).toBeInTheDocument()
    expect(session().start).not.toHaveBeenCalled()
  })
})
