import { useQuery } from '@tanstack/react-query'
import { loadCatalog } from '@/lib/catalog/loadCatalog'
import type { Exercise } from '@/types/exercise'

export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: loadCatalog,
    staleTime: Infinity,
  })
}

/** `'loading'` while the catalog loads, `undefined` when the id does not exist. */
export function useExercise(id: string): Exercise | undefined | 'loading' {
  const { data, isPending } = useCatalog()
  if (isPending) return 'loading'
  return data?.exercises.find((e) => e.id === id)
}
