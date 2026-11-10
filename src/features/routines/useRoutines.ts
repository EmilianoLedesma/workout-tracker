import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/useSession'
import { getSupabase } from '@/lib/supabase'
import type { DayLabel, Routine, RoutineExercise } from '@/types/routine'
import type { Draft } from './routineDraft'
import { STARTER_ROUTINES } from './starters'

type ItemRow = {
  position: number
  exercise_id: string
  sets: number
  target_type: 'reps' | 'seconds'
  target: number
  rest_seconds: number
}
type Row = {
  id: string
  name: string
  day_label: DayLabel | null
  is_starter: boolean
  created_at: string
  routine_exercises: ItemRow[]
}

const fromRow = (row: Row): Routine => ({
  id: row.id,
  name: row.name,
  dayLabel: row.day_label,
  isStarter: row.is_starter,
  items: [...row.routine_exercises]
    .sort((a, b) => a.position - b.position)
    .map((i) => ({
      exerciseId: i.exercise_id,
      sets: i.sets,
      targetType: i.target_type,
      target: i.target,
      restSeconds: i.rest_seconds,
    })),
})

const toItemPayload = (i: RoutineExercise) => ({
  exercise_id: i.exerciseId,
  sets: i.sets,
  target_type: i.targetType,
  target: i.target,
  rest_seconds: i.restSeconds,
})

// Day label A to G first, routines without one last, then oldest first.
const byDayThenAge = (a: Row, b: Row) =>
  Number(a.day_label === null) - Number(b.day_label === null) ||
  (a.day_label ?? '').localeCompare(b.day_label ?? '') ||
  a.created_at.localeCompare(b.created_at)

function useRoutinesKey() {
  return ['routines', useSession().session?.user.id] as const
}

export function useRoutines() {
  const key = useRoutinesKey()
  const query = useQuery({
    queryKey: key,
    enabled: !!key[1],
    queryFn: async (): Promise<Routine[]> => {
      const { data, error } = await getSupabase()
        .from('routines')
        .select(
          'id, name, day_label, is_starter, created_at, routine_exercises(position, exercise_id, sets, target_type, target, rest_seconds)',
        )
      if (error) throw new Error(error.message)
      return ((data ?? []) as Row[]).sort(byDayThenAge).map(fromRow)
    },
  })
  return {
    routines: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    hasData: query.data !== undefined,
  }
}

/**
 * Returns `undefined` while loading or when the first load failed, and `null`
 * when the id does not exist. A failed background refetch keeps the cached routine, so an
 * open editor never loses its draft.
 */
export function useRoutine(id: string) {
  const { routines, isLoading, error, hasData } = useRoutines()
  if (isLoading) return { routine: undefined, isLoading, error: null }
  if (!hasData) return { routine: undefined, isLoading, error }
  return {
    routine: routines.find((r) => r.id === id) ?? null,
    isLoading,
    error: null,
  }
}

async function saveRoutine(id: string | null, draft: Draft): Promise<string> {
  const { data, error } = await getSupabase().rpc('save_routine', {
    p_id: id,
    p_name: draft.name.trim(),
    p_day_label: draft.dayLabel,
    p_items: draft.items.map(toItemPayload),
  })
  if (error) throw new Error(error.message)
  return data as string
}

function useInvalidateRoutines() {
  const queryClient = useQueryClient()
  const key = useRoutinesKey()
  return () => queryClient.invalidateQueries({ queryKey: key })
}

export function useSaveRoutine() {
  const invalidate = useInvalidateRoutines()
  return useMutation({
    mutationFn: ({ id, draft }: { id: string | null; draft: Draft }) =>
      saveRoutine(id, draft),
    onSuccess: invalidate,
  })
}

export function useDeleteRoutine() {
  const invalidate = useInvalidateRoutines()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase()
        .from('routines')
        .delete()
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: invalidate,
  })
}

const COPY = ' (copy)'

export function useDuplicateRoutine() {
  const invalidate = useInvalidateRoutines()
  return useMutation({
    mutationFn: (routine: Routine) =>
      saveRoutine(null, {
        name: routine.name.slice(0, 60 - COPY.length) + COPY,
        dayLabel: null,
        items: routine.items,
      }),
    onSuccess: invalidate,
  })
}

export function useSeedStarters() {
  const invalidate = useInvalidateRoutines()
  return useMutation({
    mutationFn: async () => {
      const { error } = await getSupabase().rpc('seed_starter_routines', {
        p_routines: STARTER_ROUTINES.map((r) => ({
          name: r.name,
          day_label: r.dayLabel,
          items: r.items.map(toItemPayload),
        })),
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: invalidate,
  })
}
