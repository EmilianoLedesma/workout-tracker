import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Frame } from '@/types/exercise'

type Props = { frame?: Frame; alt: string; className?: string }

export function ExerciseImage({ frame, alt, className }: Props) {
  const [failed, setFailed] = useState(false)

  if (!frame || failed) {
    return (
      <div
        className={cn(
          'bg-muted text-muted-foreground flex aspect-square items-center justify-center rounded-md p-2 text-center text-xs',
          className,
        )}
      >
        <span>No illustration</span>
      </div>
    )
  }

  return (
    <img
      src={frame.src}
      alt={alt}
      width={frame.width}
      height={frame.height}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('aspect-square rounded-md object-contain', className)}
    />
  )
}
