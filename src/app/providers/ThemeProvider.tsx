import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from '@/hooks/useTheme'

const STORAGE_KEY = 'theme'

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch {
    // storage blocked: fall through to default
  }
  return 'system'
}

function prefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark())
    document.documentElement.classList.toggle('dark', isDark)
  }, [theme])

  const setTheme = (next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // storage blocked: theme still applies for this session
    }
  }

  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>
}
