import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import DashboardPage from '@/features/dashboard/DashboardPage'
import ExerciseDetailPage from '@/features/exercises/ExerciseDetailPage'
import LibraryPage from '@/features/exercises/LibraryPage'
import LoginPage from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import NotFoundPage from '@/features/NotFoundPage'
import ProgressPage from '@/features/progress/ProgressPage'
import RoutinesPage from '@/features/routines/RoutinesPage'
import CreditsPage from '@/features/settings/CreditsPage'
import SettingsPage from '@/features/settings/SettingsPage'
import WorkoutPage from '@/features/workouts/WorkoutPage'

export const routes: RouteObject[] = [
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
      { index: true, element: <DashboardPage /> },
      { path: 'routines', element: <RoutinesPage /> },
      { path: 'workout/:routineId', element: <WorkoutPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const createAppRouter = () => createBrowserRouter(routes)
