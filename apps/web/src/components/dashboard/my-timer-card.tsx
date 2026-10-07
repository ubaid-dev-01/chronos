'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Play, Square } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import { useApiClient } from '@/hooks/use-api-client'
import { formatElapsed, useTimer } from '@/providers/timer-provider'

interface MyTask {
  _id: string
  title: string
  projectId?: string
  projectName?: string
  projectColor?: string
}

interface ProjectOption {
  _id: string
  name: string
  colorHex?: string
}

/**
 * ClickUp-style "pick a task, hit start" widget for the My time page.
 * Mirrors the desktop agent's task/project selector so the same tracking
 * flow works whether the member is at their desk with the agent open or
 * just quickly starting a timer from the browser.
 */
export function MyTimerCard () {
  const { apiFetch } = useApiClient()
  const { activeTimer, elapsedSeconds, loading, starting, stopping, startTimer, stopTimer } =
    useTimer()
  const [tasks, setTasks] = useState<MyTask[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [taskId, setTaskId] = useState('')
  const [projectId, setProjectId] = useState('')

  useEffect(() => {
    queueMicrotask(() => {
      apiFetch<{ data: MyTask[] }>('/tasks/mine')
        .then(res => setTasks(res.data))
        .catch(() => setTasks([]))
      apiFetch<{ data: ProjectOption[] }>('/projects')
        .then(res => setProjects(res.data))
        .catch(() => setProjects([]))
    })
  }, [apiFetch])

  const handleTaskChange = useCallback(
    (id: string) => {
      setTaskId(id)
      const task = tasks.find(t => t._id === id)
      if (task?.projectId) setProjectId(task.projectId)
    },
    [tasks]
  )

  async function handleStart () {
    if (!projectId) {
      toast.error('Select a project (or a task) to start tracking')
      return
    }
    try {
      await startTimer(projectId, taskId || undefined)
      toast.success('Timer started')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to start timer')
    }
  }

  async function handleStop () {
    try {
      await stopTimer()
      toast.success('Timer stopped')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to stop timer')
    }
  }

  if (loading) {
    return (
      <Card padding='md'>
        <div className='flex items-center justify-center py-4'>
          <Loader2 className='h-4 w-4 animate-spin text-text-tertiary' />
        </div>
      </Card>
    )
  }

  if (activeTimer) {
    const project =
      typeof activeTimer.projectId === 'string' ? null : activeTimer.projectId
    const task =
      activeTimer.taskId && typeof activeTimer.taskId !== 'string'
        ? activeTimer.taskId
        : null

    return (
      <Card padding='md' className='border-brand/30 bg-brand/5'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <span className='relative flex h-3 w-3 shrink-0'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60' />
              <span
                className='relative inline-flex h-3 w-3 rounded-full'
                style={{ backgroundColor: project?.colorHex || '#6C2BD9' }}
              />
            </span>
            <div>
              <p className='text-sm font-medium text-text-primary'>
                {task?.title || project?.name || 'Tracking'}
              </p>
              {task && project && (
                <p className='text-xs text-text-tertiary'>{project.name}</p>
              )}
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <span className='font-mono text-lg tabular-nums text-text-primary'>
              {formatElapsed(elapsedSeconds)}
            </span>
            <button
              type='button'
              onClick={handleStop}
              disabled={stopping}
              className='flex h-9 w-9 items-center justify-center rounded-md bg-brand text-white transition-colors hover:opacity-90 disabled:opacity-50'
              aria-label='Stop timer'
            >
              {stopping ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Square className='h-3.5 w-3.5 fill-current' />
              )}
            </button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card padding='md'>
      <p className='mb-3 text-sm font-medium text-text-primary'>
        Start tracking
      </p>
      <div className='flex flex-col gap-2 sm:flex-row'>
        <Select
          value={taskId}
          onChange={e => handleTaskChange(e.target.value)}
          className='sm:flex-1'
        >
          <option value=''>No task (just track time)</option>
          {tasks.map(t => (
            <option key={t._id} value={t._id}>
              {t.title}
              {t.projectName ? ` · ${t.projectName}` : ''}
            </option>
          ))}
        </Select>
        <Select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          disabled={!!taskId}
          className='sm:w-52'
        >
          <option value=''>Select project...</option>
          {projects.map(p => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </Select>
        <button
          type='button'
          onClick={handleStart}
          disabled={starting || !projectId}
          className='inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50'
        >
          {starting ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <Play className='h-3.5 w-3.5 fill-current' />
          )}
          Start
        </button>
      </div>
    </Card>
  )
}
