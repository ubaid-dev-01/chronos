'use client'

import { Loader2, Square } from 'lucide-react'
import { formatElapsed, useTimer } from '@/providers/timer-provider'
import { toast } from 'sonner'

export function TimerBar () {
  const { activeTimer, elapsedSeconds, stopping, stopTimer } = useTimer()

  if (!activeTimer) return null

  const project =
    typeof activeTimer.projectId === 'string' ? null : activeTimer.projectId
  const task =
    activeTimer.taskId && typeof activeTimer.taskId !== 'string'
      ? activeTimer.taskId
      : null

  async function handleStop () {
    try {
      await stopTimer()
      toast.success('Timer stopped')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to stop timer')
    }
  }

  return (
    <div className='flex items-center gap-2 rounded-md border border-brand/30 bg-brand/10 px-3 py-1.5'>
      <span className='relative flex h-2 w-2 shrink-0'>
        <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60' />
        <span
          className='relative inline-flex h-2 w-2 rounded-full'
          style={{ backgroundColor: project?.colorHex || '#6C2BD9' }}
        />
      </span>
      <div className='hidden min-w-0 sm:block'>
        <p className='max-w-[160px] truncate text-xs font-medium text-text-primary'>
          {task?.title || project?.name || 'Tracking'}
        </p>
      </div>
      <span className='font-mono text-xs tabular-nums text-text-primary'>
        {formatElapsed(elapsedSeconds)}
      </span>
      <button
        type='button'
        onClick={handleStop}
        disabled={stopping}
        aria-label='Stop timer'
        className='flex h-6 w-6 items-center justify-center rounded-md bg-brand text-white transition-colors hover:opacity-90 disabled:opacity-50'
      >
        {stopping ? (
          <Loader2 className='h-3 w-3 animate-spin' />
        ) : (
          <Square className='h-2.5 w-2.5 fill-current' />
        )}
      </button>
    </div>
  )
}
