import { Outlet } from 'react-router'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="min-h-dvh md:flex">
      <main className="flex-1 pb-20 md:pb-0">
        <header className="border-b p-4 text-lg font-bold">
          Workout Tracker
        </header>
        <div className="p-4">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
