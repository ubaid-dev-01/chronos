'use client'

import {
  TeamMemberSelect,
  useCurrentUser
} from '@/components/dashboard/team-member-select'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { useApiClient } from '@/hooks/use-api-client'
import { Camera, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface TimelineSlot {
  _id: string
  thumbnailUrl: string
  s3Url: string
  timestamp: number
  minuteOffset: number
  activityScore: number
  projectName?: string
  colorHex?: string
}

interface TimelineHour {
  hour: number
  label: string
  slots: TimelineSlot[]
  count: number
}

interface TimelineData {
  date: string
  totalScreenshots: number
  hours: TimelineHour[]
}

const STATUS_COLOR = (score: number) => {
  if (score >= 0.6) return 'bg-success'
  if (score >= 0.3) return 'bg-brand'
  return 'bg-text-tertiary'
}

export default function ScreenshotsPage () {
  const { apiFetch } = useApiClient()
  const { user, isManager } = useCurrentUser()
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [userId, setUserId] = useState('')
  const [timeline, setTimeline] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<TimelineSlot | null>(null)
  const [view, setView] = useState<'timeline' | 'grid'>('timeline')

  useEffect(() => {
    queueMicrotask(() => {
      if (user && !userId) setUserId(user._id)
    })
  }, [user, userId])

  const fetchTimeline = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ date: selectedDate, userId })
      const res = await apiFetch<{ data: TimelineData }>(
        `/screenshots/timeline?${params}`
      )
      setTimeline(res.data)
    } catch {
      setTimeline(null)
    } finally {
      setLoading(false)
    }
  }, [apiFetch, selectedDate, userId])

  useEffect(() => {
    queueMicrotask(() => {
      fetchTimeline()
    })
  }, [fetchTimeline])

  const activeHours = timeline?.hours.filter(h => h.count > 0) ?? []

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Screenshots'
        description='Hourly timeline blurred by default for privacy'
      >
        <div className='flex flex-wrap items-center gap-3'>
          {isManager && userId && (
            <div className='min-w-[160px]'>
              <TeamMemberSelect value={userId} onChange={setUserId} />
            </div>
          )}
          <Input
            type='date'
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className='w-auto'
          />
          <div className='flex rounded-md border border-border p-0.5'>
            <button
              type='button'
              onClick={() => setView('timeline')}
              className={`rounded px-2.5 py-1 text-xs ${
                view === 'timeline'
                  ? 'bg-surface-elevated font-medium text-text-primary'
                  : 'text-text-tertiary'
              }`}
            >
              Timeline
            </button>
            <button
              type='button'
              onClick={() => setView('grid')}
              className={`rounded px-2.5 py-1 text-xs ${
                view === 'grid'
                  ? 'bg-surface-elevated font-medium text-text-primary'
                  : 'text-text-tertiary'
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </PageHeader>

      {loading ? (
        <div className='flex justify-center py-24'>
          <Loader2 className='h-6 w-6 animate-spin text-text-tertiary' />
        </div>
      ) : !timeline || timeline.totalScreenshots === 0 ? (
        <Card className='py-16 text-center'>
          <Camera className='mx-auto mb-4 h-10 w-10 text-text-tertiary' />
          <h3 className='text-sm font-medium text-text-primary'>
            No screenshots for this day
          </h3>
          <p className='mt-1 text-sm text-text-secondary'>
            Screenshots appear when the desktop agent captures during tracked
            time.
          </p>
        </Card>
      ) : view === 'timeline' ? (
        <Card padding='none' className='overflow-hidden'>
          <div className='border-b border-border px-4 py-3 flex items-center justify-between'>
            <p className='text-xs font-medium text-text-tertiary'>
              {timeline.totalScreenshots} screenshots · {selectedDate}
            </p>
            <div className='flex items-center gap-3 text-[10px] text-text-tertiary'>
              <span className='flex items-center gap-1'>
                <span className='h-2 w-2 rounded-full bg-success' /> High
                activity
              </span>
              <span className='flex items-center gap-1'>
                <span className='h-2 w-2 rounded-full bg-brand' /> Medium
              </span>
              <span className='flex items-center gap-1'>
                <span className='h-2 w-2 rounded-full bg-text-tertiary' /> Low
              </span>
            </div>
          </div>
          <div className='divide-y divide-border'>
            {activeHours.map(hour => (
              <div key={hour.hour} className='flex gap-4 px-4 py-3'>
                <div className='w-14 shrink-0 pt-1 text-xs font-medium tabular-nums text-text-tertiary'>
                  {hour.label}
                </div>
                <div className='relative min-h-[72px] flex-1'>
                  <div className='absolute inset-x-0 top-1/2 h-px bg-border' />
                  <div className='relative flex flex-wrap gap-2'>
                    {hour.slots.map(slot => (
                      <button
                        key={slot._id}
                        type='button'
                        onClick={() => setLightbox(slot)}
                        className='group relative w-24 overflow-hidden rounded border border-border bg-surface-elevated transition-colors hover:border-brand'
                        style={{
                          marginLeft: `${Math.min(slot.minuteOffset, 50)}%`
                        }}
                        title={`${new Date(
                          slot.timestamp
                        ).toLocaleTimeString()} · ${Math.round(
                          slot.activityScore * 100
                        )}%`}
                      >
                        <div className='aspect-video'>
                          <img
                            src={slot.thumbnailUrl}
                            alt=''
                            className='h-full w-full object-cover blur-sm transition-all group-hover:blur-none'
                            loading='lazy'
                          />
                        </div>
                        <span
                          className={`absolute bottom-0 left-0 right-0 h-0.5 ${STATUS_COLOR(
                            slot.activityScore
                          )}`}
                        />
                        <span className='block px-1 py-0.5 text-[10px] text-text-tertiary'>
                          :{String(slot.minuteOffset).padStart(2, '0')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
          {timeline.hours.flatMap(h =>
            h.slots.map(ss => (
              <button
                key={ss._id}
                type='button'
                onClick={() => setLightbox(ss)}
                className='group overflow-hidden rounded-md border border-border text-left transition-colors hover:border-text-tertiary'
              >
                <div className='relative aspect-video bg-surface-elevated'>
                  <img
                    src={ss.thumbnailUrl}
                    alt=''
                    className='h-full w-full object-cover blur-sm transition-all group-hover:blur-none'
                    loading='lazy'
                  />
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-1 ${STATUS_COLOR(
                      ss.activityScore
                    )}`}
                  />
                </div>
                <p className='p-2 text-xs text-text-secondary'>
                  {new Date(ss.timestamp).toLocaleTimeString()}
                  {ss.projectName && ` · ${ss.projectName}`}
                </p>
              </button>
            ))
          )}
        </div>
      )}

      {lightbox && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm'
          onClick={() => setLightbox(null)}
        >
          <div
            className='relative max-w-4xl w-full'
            onClick={e => e.stopPropagation()}
          >
            <button
              type='button'
              onClick={() => setLightbox(null)}
              className='absolute -top-10 right-0 text-text-tertiary hover:text-text-primary'
            >
              <X className='h-6 w-6' />
            </button>
            <img
              src={lightbox.s3Url}
              alt='Screenshot'
              className='w-full rounded-xl'
            />
            <p className='mt-3 text-center text-sm text-text-secondary'>
              {new Date(lightbox.timestamp).toLocaleString()} · Activity{' '}
              {Math.round(lightbox.activityScore * 100)}%
              {lightbox.projectName && ` · ${lightbox.projectName}`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
