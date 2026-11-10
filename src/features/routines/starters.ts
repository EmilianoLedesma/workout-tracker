import type { DayLabel, RoutineExercise } from '@/types/routine'

type Starter = { name: string; dayLabel: DayLabel; items: RoutineExercise[] }

const reps = (exerciseId: string, sets = 2, target = 8): RoutineExercise => ({
  exerciseId,
  sets,
  targetType: 'reps',
  target,
  restSeconds: 60,
})
const hold = (
  exerciseId: string,
  target: number,
  sets = 2,
): RoutineExercise => ({
  exerciseId,
  sets,
  targetType: 'seconds',
  target,
  restSeconds: 60,
})

// A suggestion drawn from real catalog ids, not advice. Some exercises have no
// level in any source, so these are "Starter", never labelled beginner.
export const STARTER_ROUTINES: Starter[] = [
  {
    name: 'Full body baseline',
    dayLabel: 'A',
    items: [
      reps('wg-wall-push-up'),
      reps('wg-bodyweight-squat'),
      reps('wg-glute-bridge'),
      reps('wg-dead-bug'),
      hold('wg-plank', 20),
      hold('wg-childs-pose', 30, 1),
    ],
  },
  {
    name: 'Lower body and core',
    dayLabel: 'B',
    items: [
      reps('project-chair-sit-to-stand'),
      reps('wg-glute-bridge'),
      reps('wg-calf-raise'),
      reps('wg-dead-bug'),
      hold('wg-wall-sit', 20),
      hold('wg-wall-calf-stretch', 30, 1),
    ],
  },
  {
    name: 'Upper body and mobility',
    dayLabel: 'C',
    items: [
      reps('wg-incline-push-up'),
      reps('wg-superman'),
      reps('wg-bird-dog'),
      reps('project-wall-angel'),
      hold('wg-arm-circles', 30, 1),
      hold('wg-cat-cow-stretch', 30, 1),
    ],
  },
]
