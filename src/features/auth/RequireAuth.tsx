import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useSession } from './useSession'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()
  const location = useLocation()

  if (loading) return <p className="p-4">Loading…</p>
  if (!session) {
    // keep the hash so Supabase link errors reach the login page
    return (
      <Navigate
        to={{ pathname: '/login', hash: location.hash }}
        state={{ from: location }}
        replace
      />
    )
  }
  return children
}
