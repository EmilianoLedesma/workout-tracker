import { Link, Outlet } from 'react-router'
import { useSession } from '@/features/auth/useSession'
import { BottomNav } from './BottomNav'

export function AppShell() {
  const { session, loading } = useSession()
  return (
    <div className="min-h-dvh md:flex">
      <main className="flex-1 pb-20 md:pb-0">
        <header className="flex items-center justify-between border-b p-4">
          <span className="text-lg font-bold">Workout Tracker</span>
          {!session && !loading && (
            <Link to="/login" className="flex min-h-11 items-center underline">
              Sign in
            </Link>
          )}
        </header>
        <div className="p-4">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
