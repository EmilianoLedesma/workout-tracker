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
    <div className="bg-grid bg-background min-h-dvh">
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <p className="font-display text-accent-text text-xl font-black tracking-wider uppercase">
          Sign in
        </p>
        <h1 className="font-display mt-4 text-[clamp(3.5rem,16vw,6rem)] leading-[0.86] font-black tracking-tight uppercase">
          Workout Tracker
        </h1>
        {sent ? (
          <p className="border-accent-fill mt-6 border-l-4 pl-4 text-base">
            Check your email for the sign-in link.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
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
              className="border-foreground bg-card focus-visible:outline-accent-text h-12 rounded-sm border-2 px-3 text-base outline-offset-2 focus-visible:outline-2"
            />
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={sending}
              className="font-display h-12 text-xl font-bold tracking-wider uppercase"
            >
              Send magic link
            </Button>
            <p className="text-muted-foreground text-sm">
              You stay signed in on this device until you sign out.
            </p>
          </form>
        )}
      </main>
    </div>
  )
}
