import { RouterProvider } from 'react-router'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { createAppRouter } from '@/app/router'

const router = createAppRouter()

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
