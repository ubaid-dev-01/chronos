'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useApiClient } from '@/hooks/use-api-client'
import { useAuth } from '@/providers/auth-provider'
import { useWebSocket } from '@/providers/websocket-provider'
import { ensureNotificationPermission, notifyBrowser } from '@/lib/notifications'

export interface ActiveTimer {
  _id: string
  startTime: number
  projectId: { _id: string; name: string; colorHex: string } | string
  taskId?: { _id: string; title: string } | string | null
}

interface TimerContextValue {
  activeTimer: ActiveTimer | null
  elapsedSeconds: number
  loading: boolean
  starting: boolean
  stopping: boolean
  startTimer: (projectId: string, taskId?: string | null) => Promise<void>
  stopTimer: () => Promise<void>
}

const TimerContext = createContext<TimerContextValue | null>(null)

function projectName (timer: ActiveTimer | null): string {
  if (!timer) return ''
  return typeof timer.projectId === 'string' ? '' : timer.projectId.name
}

function taskTitle (timer: ActiveTimer | null): string {
  if (!timer?.taskId) return ''
  return typeof timer.taskId === 'string' ? '' : timer.taskId.title
}

export function TimerProvider ({ children }: { children: React.ReactNode }) {
  const { apiFetch } = useApiClient()
  const { user } = useAuth()
  const { socket } = useWebSocket()
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [stopping, setStopping] = useState(false)
  const hasLoadedOnce = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: ActiveTimer | null }>('/timelogs/active')
      setActiveTimer(res.data)
    } catch {
      // Not authenticated yet, or a transient network error next poll
      // (or the websocket-driven refresh below) will retry.
    } finally {
      setLoading(false)
      hasLoadedOnce.current = true
    }
  }, [apiFetch])

  useEffect(() => {
    queueMicrotask(() => {
      refresh()
    })
  }, [refresh])

  useEffect(() => {
    ensureNotificationPermission()
  }, [])

  useEffect(() => {
    if (!activeTimer) {
      queueMicrotask(() => setElapsedSeconds(0))
      return
    }
    const tick = () =>
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - activeTimer.startTime) / 1000))
      )
    queueMicrotask(tick)
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [activeTimer])

  // Keep every open tab (and the timer bar right after a desktop-agent
  // start/stop) in sync via the same WebSocket connection Team Pulse uses.
  useEffect(() => {
    if (!socket || !user) return

    const onStarted = (data: { userId: string }) => {
      if (data.userId === user._id) refresh()
    }
    const onStopped = (data: { userId: string }) => {
      if (data.userId === user._id) refresh()
    }

    socket.on('timer_started', onStarted)
    socket.on('timer_stopped', onStopped)
    return () => {
      socket.off('timer_started', onStarted)
      socket.off('timer_stopped', onStopped)
    }
  }, [socket, user, refresh])

  const startTimer = useCallback(
    async (projectId: string, taskId?: string | null) => {
      setStarting(true)
      try {
        const res = await apiFetch<{ data: ActiveTimer }>('/timelogs/start', {
          method: 'POST',
          body: JSON.stringify({ projectId, taskId: taskId || undefined })
        })
        setActiveTimer(res.data)
        notifyBrowser(
          'Tracking started',
          taskTitle(res.data)
            ? `Now tracking "${taskTitle(res.data)}"`
            : `Now tracking on ${projectName(res.data)}`
        )
      } finally {
        setStarting(false)
      }
    },
    [apiFetch]
  )

  const stopTimer = useCallback(async () => {
    setStopping(true)
    const previous = activeTimer
    try {
      await apiFetch('/timelogs/stop', { method: 'POST' })
      setActiveTimer(null)
      notifyBrowser(
        'Tracking stopped',
        previous
          ? taskTitle(previous)
            ? `Stopped tracking "${taskTitle(previous)}"`
            : `Stopped tracking on ${projectName(previous)}`
          : undefined
      )
    } finally {
      setStopping(false)
    }
  }, [apiFetch, activeTimer])

  const value = useMemo(
    () => ({
      activeTimer,
      elapsedSeconds,
      loading,
      starting,
      stopping,
      startTimer,
      stopTimer
    }),
    [activeTimer, elapsedSeconds, loading, starting, stopping, startTimer, stopTimer]
  )

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export function useTimer () {
  const ctx = useContext(TimerContext)
  if (!ctx) {
    throw new Error('useTimer must be used within a TimerProvider')
  }
  return ctx
}

export function formatElapsed (totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}
