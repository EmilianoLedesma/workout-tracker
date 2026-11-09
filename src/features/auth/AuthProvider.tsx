import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase'
import { AuthContext } from './useSession'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    const { auth } = getSupabase()
    auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setLoading(false))
    const { data } = auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await getSupabase().auth.signOut()
    } finally {
      // drop cached data even if the network call fails
      queryClient.clear()
    }
  }

  return (
    <AuthContext value={{ session, loading, signOut }}>{children}</AuthContext>
  )
}
