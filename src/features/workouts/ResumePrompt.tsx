import { Button } from '@/components/ui/button'
import type { Workout } from '@/types/workout'
import { cta } from './SetView'

type Props = {
  draft: Workout
  stale: boolean
  onContinue: () => void
  onDiscard: () => void
}

export function ResumePrompt({ draft, stale, onContinue, onDiscard }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="page-title">Workout in progress</h1>
      <p>
        {stale
          ? `You have an unfinished workout from more than a day ago: ${draft.routineName}.`
          : `You have an unfinished workout: ${draft.routineName}.`}
      </p>
      <Button type="button" className={cta} onClick={onContinue}>
        Continue
      </Button>
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full border-2 border-foreground font-bold"
        onClick={onDiscard}
      >
        Discard and start new
      </Button>
    </div>
  )
}
