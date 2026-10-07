'use client'

import { useCurrentUser } from '@/components/dashboard/team-member-select'
import { Card } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { useApiClient } from '@/hooks/use-api-client'
import { Flame, Gauge, Loader2, Split, Timer } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

interface FocusBlock {
  startTime: number
  endTime: number
  durationMs: number
  processName: string
  avgActivityScore: number
  isDeepWork: boolean
}

interface FocusDaySummary {
  date: string
  focusScore: number
  deepWorkHours: number
  totalHours: number
}

interface FocusScoreResult {
  focusScore: number
  totalTrackedMs: number
  deepWorkMs: number
  idleMs: number
  appSwitches: number
  appSwitchesPerHour: number
  longestDeepWorkMs: number
  blocks: FocusBlock[]
  dailyScores: FocusDaySummary[]
}

interface TeamFocusRow {
  userId: string
  displayName: string
  focusScore: number
  deepWorkHours: number
  totalHours: number
}

function getWeekAgo () {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  return d.toISOString().split('T')[0]
}

function getToday () {
  return new Date().toISOString().split('T')[0]
}

function hoursLabel (ms: number) {
  return (ms / 3600000).toFixed(1) + 'h'
}

function scoreColor (score: number) {
  if (score >= 70) return 'text-success'
  if (score >= 40) return 'text-warning'
  return 'text-danger'
}

export default function FocusPage () {
  const { apiFetch } = useApiClient()
  const { isManager } = useCurrentUser()
  const [startDate, setStartDate] = useState(getWeekAgo)
  const [endDate, setEndDate] = useState(getToday)
  const [view, setView] = useState<'me' | 'team'>('me')
  const [data, setData] = useState<FocusScoreResult | null>(null)
  const [teamRows, setTeamRows] = useState<TeamFocusRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFocus = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate, endDate })
      if (view === 'team') {
        params.set('view', 'team')
        const res = await apiFetch<{ data: { rows: TeamFocusRow[] } }>(
          `/analytics/focus?${params}`
        )
        setTeamRows(res.data.rows)
        setData(null)
      } else {
        const res = await apiFetch<{ data: FocusScoreResult }>(
          `/analytics/focus?${params}`
        )
        setData(res.data)
      }
    } catch {
      setData(null)
      setTeamRows([])
    } finally {
      setLoading(false)
    }
  }, [apiFetch, startDate, endDate, view])

  useEffect(() => {
    queueMicrotask(() => {
      fetchFocus()
    })
  }, [fetchFocus])

  const timelineTotal = data
    ? data.blocks.reduce((s, b) => s + b.durationMs, 0)
    : 0

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Focus Score'
        description='Deep work vs fragmented time, calculated from tracked activity'
      />

      <Card padding='sm'>
        <div className='flex flex-wrap items-end gap-4'>
          <div>
            <label className='mb-1.5 block text-xs text-text-tertiary'>
              From
            </label>
            <Input
              type='date'
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className='w-auto'
            />
          </div>
          <div>
            <label className='mb-1.5 block text-xs text-text-tertiary'>
              To
            </label>
            <Input
              type='date'
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className='w-auto'
            />
          </div>
          {isManager && (
            <div className='min-w-[160px]'>
              <label className='mb-1.5 block text-xs text-text-tertiary'>
                View
              </label>
              <Select
                value={view}
                onChange={e => setView(e.target.value as 'me' | 'team')}
              >
                <option value='me'>My focus</option>
                <option value='team'>Whole team</option>
              </Select>
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <div className='flex justify-center py-24'>
          <Loader2 className='h-6 w-6 animate-spin text-text-tertiary' />
        </div>
      ) : view === 'team' ? (
        teamRows.length === 0 ? (
          <Card className='flex flex-col items-center py-16 text-center'>
            <Gauge className='mb-4 h-10 w-10 text-text-tertiary' />
            <p className='text-sm font-medium text-text-primary'>
              No tracked time in this range
            </p>
          </Card>
        ) : (
          <Card padding='none'>
            <div className='border-b border-border px-4 py-3'>
              <p className='text-xs font-medium text-text-tertiary'>
                Team focus scores
              </p>
            </div>
            <ul className='divide-y divide-border'>
              {teamRows.map(row => (
                <li
                  key={row.userId}
                  className='flex items-center justify-between px-4 py-3'
                >
                  <p className='text-sm font-medium text-text-primary'>
                    {row.displayName}
                  </p>
                  <div className='flex items-center gap-6'>
                    <div className='text-right'>
                      <p className='font-mono text-sm text-text-primary'>
                        {row.deepWorkHours}h / {row.totalHours}h
                      </p>
                      <p className='text-[11px] text-text-tertiary'>
                        deep work
                      </p>
                    </div>
                    <p
                      className={`font-mono text-lg font-medium tabular-nums ${scoreColor(
                        row.focusScore
                      )}`}
                    >
                      {row.focusScore}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )
      ) : !data || data.totalTrackedMs === 0 ? (
        <Card className='flex flex-col items-center py-16 text-center'>
          <Gauge className='mb-4 h-10 w-10 text-text-tertiary' />
          <p className='text-sm font-medium text-text-primary'>
            No tracked time in this range
          </p>
          <p className='mt-1 max-w-sm text-sm text-text-secondary'>
            Focus score is calculated once time logs with app/window data are
            synced.
          </p>
        </Card>
      ) : (
        <>
          <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
            <Card padding='md'>
              <div className='flex items-center justify-between'>
                <p className='text-sm text-text-secondary'>Focus score</p>
                <Gauge className='h-4 w-4 text-text-tertiary' />
              </div>
              <p
                className={`mt-2 font-mono text-3xl font-medium tracking-tight ${scoreColor(
                  data.focusScore
                )}`}
              >
                {data.focusScore}
              </p>
            </Card>
            <Card padding='md'>
              <div className='flex items-center justify-between'>
                <p className='text-sm text-text-secondary'>Deep work</p>
                <Flame className='h-4 w-4 text-text-tertiary' />
              </div>
              <p className='mt-2 font-mono text-3xl font-medium tracking-tight text-text-primary'>
                {hoursLabel(data.deepWorkMs)}
              </p>
            </Card>
            <Card padding='md'>
              <div className='flex items-center justify-between'>
                <p className='text-sm text-text-secondary'>Longest block</p>
                <Timer className='h-4 w-4 text-text-tertiary' />
              </div>
              <p className='mt-2 font-mono text-3xl font-medium tracking-tight text-text-primary'>
                {hoursLabel(data.longestDeepWorkMs)}
              </p>
            </Card>
            <Card padding='md'>
              <div className='flex items-center justify-between'>
                <p className='text-sm text-text-secondary'>App switches</p>
                <Split className='h-4 w-4 text-text-tertiary' />
              </div>
              <p className='mt-2 font-mono text-3xl font-medium tracking-tight text-text-primary'>
                {data.appSwitchesPerHour}
                <span className='text-sm text-text-tertiary'>/hr</span>
              </p>
            </Card>
          </div>

          <Card padding='md'>
            <p className='mb-3 text-xs font-medium text-text-tertiary'>
              Timeline deep work vs fragmented time
            </p>
            {timelineTotal === 0 ? (
              <p className='text-sm text-text-tertiary'>No blocks to show</p>
            ) : (
              <div className='flex h-3 overflow-hidden rounded-full bg-surface-elevated'>
                {data.blocks.map((b, i) => (
                  <div
                    key={i}
                    title={`${b.processName} · ${hoursLabel(b.durationMs)}`}
                    className={
                      b.isDeepWork ? 'bg-brand' : 'bg-text-tertiary/40'
                    }
                    style={{
                      width: `${(b.durationMs / timelineTotal) * 100}%`
                    }}
                  />
                ))}
              </div>
            )}
            <div className='mt-3 flex gap-4 text-xs text-text-tertiary'>
              <span className='flex items-center gap-1.5'>
                <span className='h-2 w-2 rounded-full bg-brand' /> Deep work
              </span>
              <span className='flex items-center gap-1.5'>
                <span className='h-2 w-2 rounded-full bg-text-tertiary/40' />{' '}
                Fragmented / idle
              </span>
            </div>
          </Card>

          <Card padding='none'>
            <div className='border-b border-border px-4 py-3'>
              <p className='text-xs font-medium text-text-tertiary'>
                Daily focus scores
              </p>
            </div>
            <div className='flex items-end gap-2 overflow-x-auto p-4'>
              {data.dailyScores.map(d => (
                <div key={d.date} className='flex flex-col items-center gap-1'>
                  <div className='flex h-24 w-8 items-end rounded bg-surface-elevated'>
                    <div
                      className={`w-full rounded ${
                        d.focusScore >= 70
                          ? 'bg-success'
                          : d.focusScore >= 40
                          ? 'bg-warning'
                          : 'bg-danger'
                      }`}
                      style={{ height: `${Math.max(d.focusScore, 4)}%` }}
                    />
                  </div>
                  <p className='text-[10px] text-text-tertiary'>
                    {d.date.slice(5)}
                  </p>
                  <p className='text-[10px] font-medium text-text-primary'>
                    {d.focusScore}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
