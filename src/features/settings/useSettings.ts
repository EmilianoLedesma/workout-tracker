import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/useSession'
import { EQUIPMENT, type Equipment } from '@/lib/catalog/vocab'
import { getSupabase } from '@/lib/supabase'

export type Theme = 'light' | 'dark' | 'system'

export type Settings = {
  weeklyGoal: number
  equipment: Equipment[]
  theme: Theme
}

export const DEFAULT_SETTINGS: Settings = {
  weeklyGoal: 3,
  equipment: ['bodyweight', 'wall', 'chair'],
  theme: 'system',
}

type Row = { weekly_goal: number; equipment: string[]; theme: Theme }

const fromRow = (row: Row): Settings => ({
  weeklyGoal: row.weekly_goal,
  equipment: row.equipment.filter((e): e is Equipment =>
    (EQUIPMENT as readonly string[]).includes(e),
  ),
  theme: row.theme,
})

export function useSettings() {
  const userId = useSession().session?.user.id
  const query = useQuery({
    queryKey: ['settings', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Settings> => {
      const { data, error } = await getSupabase()
        .from('user_settings')
        .select('weekly_goal, equipment, theme')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw new Error(error.message)
      // no row yet: the user has not changed anything, so defaults apply
      return data ? fromRow(data as Row) : DEFAULT_SETTINGS
    },
  })
  return {
    settings: query.data ?? DEFAULT_SETTINGS,
    isLoading: query.isLoading,
    error: query.error,
  }
}

export function useUpdateSettings() {
  const userId = useSession().session?.user.id
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Settings>) => {
      const { error } = await getSupabase()
        .from('user_settings')
        .upsert(
          {
            user_id: userId,
            ...(patch.weeklyGoal !== undefined && {
              weekly_goal: patch.weeklyGoal,
            }),
            ...(patch.equipment !== undefined && {
              equipment: patch.equipment,
            }),
            ...(patch.theme !== undefined && { theme: patch.theme }),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
      if (error) throw new Error(error.message)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['settings', userId] }),
  })
}
