import { useMutation } from '@tanstack/react-query'
import { useSession } from '@/features/auth/useSession'
import { getSupabase } from '@/lib/supabase'
import type { SessionPayload } from './workoutState'

/**
 * Saves a finished workout as one row. The client-made id plus
 * `ignoreDuplicates` makes a retry harmless: a second attempt for the same
 * workout inserts nothing.
 */
export function useSaveSession() {
  const userId = useSession().session?.user.id
  return useMutation({
    mutationFn: async (p: SessionPayload): Promise<void> => {
      if (!userId) throw new Error('Not signed in')
      const insert = (routineId: string | null) =>
        getSupabase().from('sessions').upsert(
          {
            id: p.id,
            user_id: userId,
            routine_id: routineId,
            routine_name: p.routineName,
            started_at: p.startedAt,
            finished_at: p.finishedAt,
            duration_seconds: p.durationSeconds,
            status: p.status,
            note: p.note,
            log: p.log,
          },
          { onConflict: 'id', ignoreDuplicates: true },
        )
      let { error } = await insert(p.routineId)
      // The routine was deleted while the workout ran: the link is gone but the
      // workout is still real, so save it unlinked instead of failing forever.
      if (error?.code === '23503' && p.routineId) {
        ;({ error } = await insert(null))
      }
      if (error) throw new Error(error.message)
    },
  })
}
