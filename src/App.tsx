import { RouterProvider } from 'react-router'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { createAppRouter } from '@/app/router'
import { ConfigError } from '@/components/layout/ConfigError'
import { parseEnv } from '@/lib/env'

const router = createAppRouter()

export default function App() {
  const env = parseEnv(import.meta.env)
  return (
    <ThemeProvider>
      {env.ok ? (
        <QueryProvider>
          <RouterProvider router={router} />
        </QueryProvider>
      ) : (
        <ConfigError missing={env.missing} />
      )}
    </ThemeProvider>
  )
}
