import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { Catalog, Exercise } from '@/types/exercise'
import { useCatalog, useExercise } from './useCatalog'

const fixture: Catalog = {
  generatedAt: 'now',
  exercises: [{ id: 'wg-plank', name: 'Plank' } as Exercise],
}

vi.mock('@/lib/catalog/loadCatalog', () => ({
  loadCatalog: async () => fixture,
}))

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
)

it('loads the catalog', async () => {
  const { result } = renderHook(() => useCatalog(), { wrapper })
  await waitFor(() => expect(result.current.data).toEqual(fixture))
})

it('returns "loading" then the exercise', async () => {
  const { result } = renderHook(() => useExercise('wg-plank'), { wrapper })
  expect(result.current).toBe('loading')
  await waitFor(() => expect(result.current).toMatchObject({ name: 'Plank' }))
})

it('returns undefined for an unknown id once loaded', async () => {
  const { result } = renderHook(() => useExercise('missing'), { wrapper })
  await waitFor(() => expect(result.current).toBeUndefined())
})
