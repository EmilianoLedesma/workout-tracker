import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthContextValue = {
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useSession(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useSession must be used inside AuthProvider')
  return ctx
}
