'use client'

import { Card } from '@/components/ui/card'
import { useApiClient } from '@/hooks/use-api-client'
import { Camera, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface ScreenshotData {
  _id: string
  thumbnailUrl: string
  s3Url: string
  timestamp: number
  isBlurred: boolean
}

export function RecentScreenshots () {
  const { apiFetch } = useApiClient()
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiFetch<{ data: ScreenshotData[] }>(
          '/screenshots?limit=6'
        )
        if (!cancelled) setScreenshots(res.data ?? [])
      } catch {
        if (!cancelled) setScreenshots([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiFetch])

  return (
    <Card className='h-full'>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='text-sm font-medium text-text-primary'>
          Recent screenshots
        </h2>
        <Link
          href='/screenshots'
          className='text-xs text-text-tertiary hover:text-text-primary'
        >
          View all
        </Link>
      </div>
      {loading ? (
        <div className='flex justify-center py-10'>
          <Loader2 className='h-5 w-5 animate-spin text-text-tertiary' />
        </div>
      ) : screenshots.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-8 text-center'>
          <Camera className='mb-3 h-8 w-8 text-text-tertiary' />
          <p className='text-sm text-text-secondary'>
            Screenshots appear once your team starts tracking with the desktop
            agent.
          </p>
        </div>
      ) : (
        <div className='space-y-2'>
          {screenshots.map(ss => (
            <div
              key={ss._id}
              className='flex items-center gap-3 rounded-md border border-border bg-surface-elevated/50 p-2'
            >
              <div className='h-10 w-16 shrink-0 overflow-hidden rounded bg-background'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ss.thumbnailUrl}
                  alt='Screenshot'
                  className='h-full w-full object-cover blur-sm'
                />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='font-mono text-xs text-text-secondary'>
                  {new Date(ss.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className='text-[11px] text-text-tertiary'>
                  {ss.isBlurred ? 'Privacy blurred' : 'Original'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
