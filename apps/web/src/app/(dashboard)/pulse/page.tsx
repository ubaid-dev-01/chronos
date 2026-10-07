'use client'

import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { useApiClient } from '@/hooks/use-api-client'
import { useWebSocket } from '@/providers/websocket-provider'
import type { ActivityFeedEvent } from '@chronos/types'
import { CheckCircle2, Coffee, Flame, MessageSquare, Radio } from 'lucide-react'
import { useEffect, useState } from 'react'

const FEED_ICONS: Record<
  ActivityFeedEvent['type'],
  React.ComponentType<{ className?: string }>
> = {
  session_start: Radio,
  project_switch: Radio,
  task_completed: CheckCircle2,
  comment: MessageSquare,
  break: Coffee,
  streak: Flame
}

function timeAgo (ts: number) {
  const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function PulsePage () {
  const { apiFetch } = useApiClient()
  const { connected, teamPresence, activityFeed: liveFeed } = useWebSocket()
  const [initialFeed, setInitialFeed] = useState<ActivityFeedEvent[]>([])
  const [, forceTick] = useState(0)

  useEffect(() => {
    queueMicrotask(() => {
      apiFetch<{ data: ActivityFeedEvent[] }>('/pulse/feed')
        .then(res => setInitialFeed(res.data))
        .catch(() => setInitialFeed([]))
    })
  }, [apiFetch])

  // Re-render periodically so "time ago" labels stay fresh.
  useEffect(() => {
    const interval = setInterval(() => forceTick(n => n + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  const liveIds = new Set(liveFeed.map(e => e.id))
  const feed = [
    ...liveFeed,
    ...initialFeed.filter(e => !liveIds.has(e.id))
  ].slice(0, 60)

  const activeNow = teamPresence.filter(
    p => p.status === 'active' || p.status === 'idle'
  )

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Team Pulse'
        description="Live view of who's working on what, right now"
      >
        <span
          className={`flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs ${
            connected ? 'text-success' : 'text-text-tertiary'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              connected ? 'bg-success' : 'bg-text-tertiary'
            }`}
          />
          {connected ? 'Live' : 'Connecting…'}
        </span>
      </PageHeader>

      <div>
        <p className='label-caps mb-3 text-text-tertiary'>
          Active now · {activeNow.length}
        </p>
        {activeNow.length === 0 ? (
          <Card className='py-10 text-center text-sm text-text-tertiary'>
            No one is actively tracked right now
          </Card>
        ) : (
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
            {activeNow.map(p => (
              <Card key={p.userId} padding='sm'>
                <div className='flex items-center gap-2'>
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      p.status === 'active' ? 'bg-success' : 'bg-warning'
                    }`}
                  />
                  <p className='truncate text-sm font-medium text-text-primary'>
                    {p.currentProject || 'No project'}
                  </p>
                </div>
                <p className='mt-1.5 text-xs capitalize text-text-tertiary'>
                  {p.status} · {(p.activeTime / 3600000).toFixed(1)}h today
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card padding='none'>
        <div className='border-b border-border px-4 py-3'>
          <p className='text-xs font-medium text-text-tertiary'>
            Activity feed
          </p>
        </div>
        {feed.length === 0 ? (
          <p className='px-4 py-10 text-center text-sm text-text-tertiary'>
            No activity yet events appear here as the team tracks time, finishes
            tasks, and comments.
          </p>
        ) : (
          <ul className='max-h-[560px] divide-y divide-border overflow-y-auto'>
            {feed.map(event => {
              const Icon = FEED_ICONS[event.type] ?? Radio
              return (
                <li key={event.id} className='flex items-start gap-3 px-4 py-3'>
                  <div
                    className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface-elevated'
                    style={
                      event.colorHex
                        ? { borderColor: event.colorHex }
                        : undefined
                    }
                  >
                    <Icon className='h-3.5 w-3.5 text-text-secondary' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm text-text-primary'>
                      <span className='font-medium'>{event.userName}</span>{' '}
                      {event.message}
                    </p>
                    <p className='text-xs text-text-tertiary'>
                      {timeAgo(event.timestamp)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
