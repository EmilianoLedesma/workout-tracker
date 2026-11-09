import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import DashboardPage from '@/features/dashboard/DashboardPage'
import LibraryPage from '@/features/exercises/LibraryPage'
import NotFoundPage from '@/features/NotFoundPage'
import ProgressPage from '@/features/progress/ProgressPage'
import RoutinesPage from '@/features/routines/RoutinesPage'
import SettingsPage from '@/features/settings/SettingsPage'
import WorkoutPage from '@/features/workouts/WorkoutPage'

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'library', element: <LibraryPage /> },
      { path: 'routines', element: <RoutinesPage /> },
      { path: 'workout/:routineId', element: <WorkoutPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const createAppRouter = () => createBrowserRouter(routes)
