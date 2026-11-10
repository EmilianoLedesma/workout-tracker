import { useEffect, useState } from 'react'

/**
 * The current time, refreshed on an interval while `active`. It also refreshes
 * the moment the page becomes visible again, so a phone that slept shows the
 * right remaining time straight away.
 */
export function useNow(active: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, intervalMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active, intervalMs])
  return now
}
