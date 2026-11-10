import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import DashboardPage from '@/features/dashboard/DashboardPage'
import ExerciseDetailPage from '@/features/exercises/ExerciseDetailPage'
import LibraryPage from '@/features/exercises/LibraryPage'
import LandingPage from '@/features/landing/LandingPage'
import LoginPage from '@/features/auth/LoginPage'
import { useSession } from '@/features/auth/useSession'
import { RequireAuth } from '@/features/auth/RequireAuth'
import NotFoundPage from '@/features/NotFoundPage'
import ProgressPage from '@/features/progress/ProgressPage'
import RoutinesPage from '@/features/routines/RoutinesPage'
import CreditsPage from '@/features/settings/CreditsPage'
import SettingsPage from '@/features/settings/SettingsPage'
import WorkoutPage from '@/features/workouts/WorkoutPage'

// "/" is the landing page for visitors and the Dashboard once signed in.
function Home() {
  const { session, loading } = useSession()
  if (loading) return <p className="p-4">Loading…</p>
  return session ? (
    <AppShell>
      <DashboardPage />
    </AppShell>
  ) : (
    <LandingPage />
  )
}

export const routes: RouteObject[] = [
  { index: true, element: <Home /> },
  { path: 'login', element: <LoginPage /> },
  {
    // Public: the exercise catalog is static data, no account needed.
    element: <AppShell />,
    children: [
      { path: 'library', element: <LibraryPage /> },
      { path: 'library/:exerciseId', element: <ExerciseDetailPage /> },
      { path: 'credits', element: <CreditsPage /> },
    ],
  },
  {
    // Personal pages: sign-in required.
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { path: 'routines', element: <RoutinesPage /> },
      { path: 'workout/:routineId', element: <WorkoutPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const createAppRouter = () => createBrowserRouter(routes)
