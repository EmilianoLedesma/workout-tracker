import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { getSupabase } from '@/lib/supabase'
import { useSession } from './useSession'

type From = { pathname?: string; search?: string }

export default function LoginPage() {
  const { session } = useSession()
  const location = useLocation()
  const from = (location.state as { from?: From } | null)?.from
  const target = (from?.pathname ?? '/') + (from?.search ?? '')

  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(() =>
    new URLSearchParams(location.hash.slice(1)).get('error_description'),
  )

  if (session) return <Navigate to={target} replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!z.email().safeParse(email).success) {
      setError('Enter a valid email')
      return
    }
    setError(null)
    setSending(true)
    const { error: otpError } = await getSupabase().auth.signInWithOtp({
      email,
      // the link returns to the page the user was trying to open
      options: { emailRedirectTo: window.location.origin + target },
    })
    setSending(false)
    if (otpError) setError(otpError.message)
    else setSent(true)
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="page-title">Workout Tracker</h1>
      {sent ? (
        <p className="mt-4">Check your email for the sign-in link.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="text"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-input h-11 rounded-md border px-3"
          />
          {error && <p role="alert">{error}</p>}
          <Button type="submit" disabled={sending} className="h-11">
            Send magic link
          </Button>
        </form>
      )}
    </div>
  )
}
