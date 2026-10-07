'use client'

import {
  TeamMemberSelect,
  useCurrentUser
} from '@/components/dashboard/team-member-select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { useApiClient } from '@/hooks/use-api-client'
import { ChevronLeft, ChevronRight, Loader2, MessageSquare } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface DaySummary {
  date: string
  totalMs: number
  totalHours: string
  entries: Array<{
    projectId: string
    projectName: string
    colorHex: string
    ms: number
    hours: string
  }>
}

interface CalendarData {
  year: number
  month: number
  monthTotalHours: string
  days: DaySummary[]
  weekTotals: Array<{ weekStart: string; totalHours: string }>
}

interface DayBreakdown {
  date: string
  breakdown: Array<{
    projectId: string
    projectName: string
    colorHex: string
    users: Array<{ userId: string; displayName: string; hours: string }>
  }>
  timeline?: Array<{
    _id: string
    startTime: number
    endTime: number | null
    durationMs: number
    hours: string
    activityScore: number
    isOffline: boolean
    source: string
    processName?: string
    windowTitle?: string
    projectId: string
    projectName: string
    colorHex: string
  }>
}

interface DayComment {
  _id: string
  userName: string
  text: string
  createdAt: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

export default function SummaryPage () {
  const { apiFetch } = useApiClient()
  const { user, isManager, loading: userLoading } = useCurrentUser()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [calendar, setCalendar] = useState<CalendarData | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayDetail, setDayDetail] = useState<DayBreakdown | null>(null)
  const [dayComments, setDayComments] = useState<DayComment[]>([])
  const [commentText, setCommentText] = useState('')
  const [dayLoading, setDayLoading] = useState(false)
  const [commentSaving, setCommentSaving] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      if (user && !selectedUserId) setSelectedUserId(user._id)
    })
  }, [user, selectedUserId])

  const userQuery = selectedUserId ? `&userId=${selectedUserId}` : ''

  const fetchCalendar = useCallback(async () => {
    if (!selectedUserId) return
    setLoading(true)
    try {
      const res = await apiFetch<{ data: CalendarData }>(
        `/summary/calendar?year=${year}&month=${month}${userQuery}`
      )
      setCalendar(res.data)
    } catch {
      setCalendar(null)
    } finally {
      setLoading(false)
    }
  }, [apiFetch, year, month, userQuery, selectedUserId])

  useEffect(() => {
    queueMicrotask(() => {
      fetchCalendar()
    })
  }, [fetchCalendar])

  async function loadDay (date: string) {
    setSelectedDate(date)
    setDayLoading(true)
    setCommentText('')
    try {
      const [dayRes, commentsRes] = await Promise.all([
        apiFetch<{ data: DayBreakdown }>(
          `/summary/day?date=${date}${userQuery}`
        ),
        apiFetch<{ data: DayComment[] }>(
          `/comments?targetType=day&targetId=${date}&limit=20${
            userQuery ? `&userId=${selectedUserId}` : ''
          }`
        )
      ])
      setDayDetail(dayRes.data)
      setDayComments(commentsRes.data ?? [])
    } catch {
      setDayDetail(null)
      setDayComments([])
    } finally {
      setDayLoading(false)
    }
  }

  async function postDayComment () {
    if (!selectedDate || !commentText.trim()) return
    setCommentSaving(true)
    try {
      await apiFetch('/comments', {
        method: 'POST',
        body: JSON.stringify({
          targetType: 'day',
          targetId: selectedDate,
          text: commentText.trim(),
          ...(isManager && selectedUserId !== user?._id
            ? { userId: selectedUserId }
            : {})
        })
      })
      toast.success('Comment added')
      setCommentText('')
      const commentsRes = await apiFetch<{ data: DayComment[] }>(
        `/comments?targetType=day&targetId=${selectedDate}&limit=20${
          userQuery ? `&userId=${selectedUserId}` : ''
        }`
      )
      setDayComments(commentsRes.data ?? [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add comment')
    } finally {
      setCommentSaving(false)
    }
  }

  function prevMonth () {
    if (month === 1) {
      setYear(y => y - 1)
      setMonth(12)
    } else {
      setMonth(m => m - 1)
    }
    setSelectedDate(null)
    setDayDetail(null)
    setDayComments([])
  }

  function nextMonth () {
    if (month === 12) {
      setYear(y => y + 1)
      setMonth(1)
    } else {
      setMonth(m => m + 1)
    }
    setSelectedDate(null)
    setDayDetail(null)
    setDayComments([])
  }

  const dayMap = new Map(calendar?.days.map(d => [d.date, d]) ?? [])
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: Array<{ date: string | null; dayNum: number | null }> = []

  for (let i = 0; i < firstDay; i++) cells.push({ date: null, dayNum: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(
      d
    ).padStart(2, '0')}`
    cells.push({ date: dateStr, dayNum: d })
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Summary'
        description='Monthly calendar view of tracked time'
      >
        <div className='flex flex-wrap items-center gap-3'>
          {isManager && !userLoading && (
            <div className='min-w-[160px]'>
              <TeamMemberSelect
                value={selectedUserId}
                onChange={id => {
                  setSelectedUserId(id)
                  setSelectedDate(null)
                  setDayDetail(null)
                  setDayComments([])
                }}
              />
            </div>
          )}
          <div className='flex items-center gap-2'>
            <Button variant='secondary' size='sm' onClick={prevMonth}>
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <span className='min-w-[140px] text-center text-sm font-medium'>
              {MONTHS[month - 1]} {year}
            </span>
            <Button variant='secondary' size='sm' onClick={nextMonth}>
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className='grid gap-6 lg:grid-cols-3'>
        <Card className='lg:col-span-2' padding='none'>
          {loading ? (
            <div className='flex items-center justify-center py-24'>
              <Loader2 className='h-6 w-6 animate-spin text-text-tertiary' />
            </div>
          ) : (
            <>
              <div className='grid grid-cols-7 border-b border-border'>
                {WEEKDAYS.map(w => (
                  <div
                    key={w}
                    className='px-2 py-2 text-center text-xs font-medium text-text-tertiary'
                  >
                    {w}
                  </div>
                ))}
              </div>
              <div className='grid grid-cols-7'>
                {cells.map((cell, i) => {
                  const summary = cell.date ? dayMap.get(cell.date) : null
                  const isSelected = cell.date === selectedDate
                  const isToday = cell.date === now.toISOString().split('T')[0]

                  return (
                    <button
                      key={i}
                      type='button'
                      disabled={!cell.date}
                      onClick={() => cell.date && loadDay(cell.date)}
                      className={`min-h-[88px] border-b border-r border-border p-2 text-left transition-colors ${
                        !cell.date
                          ? 'bg-surface/50'
                          : isSelected
                          ? 'bg-brand/10'
                          : 'hover:bg-surface-elevated/60'
                      }`}
                    >
                      {cell.dayNum && (
                        <>
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                              isToday
                                ? 'bg-brand text-white'
                                : 'text-text-secondary'
                            }`}
                          >
                            {cell.dayNum}
                          </span>
                          {summary && (
                            <div className='mt-1 space-y-0.5'>
                              <p className='text-xs font-medium text-text-primary'>
                                {summary.totalHours}
                              </p>
                              {summary.entries.slice(0, 2).map(e => (
                                <div
                                  key={e.projectId}
                                  className='flex items-center gap-1'
                                >
                                  <span
                                    className='h-1.5 w-1.5 shrink-0 rounded-full'
                                    style={{ backgroundColor: e.colorHex }}
                                  />
                                  <span className='truncate text-[10px] text-text-tertiary'>
                                    {e.projectName}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </Card>

        <div className='space-y-4'>
          <Card>
            <p className='text-xs text-text-tertiary'>Month total</p>
            <p className='mt-1 text-2xl font-medium tabular-nums text-text-primary'>
              {calendar?.monthTotalHours ?? '00:00'}
            </p>
          </Card>

          {calendar && calendar.weekTotals.length > 0 && (
            <Card padding='sm'>
              <p className='mb-3 text-xs font-medium text-text-tertiary'>
                Weekly totals
              </p>
              <div className='space-y-2'>
                {calendar.weekTotals.map(w => (
                  <div
                    key={w.weekStart}
                    className='flex items-center justify-between text-sm'
                  >
                    <span className='text-text-secondary'>
                      Week of {w.weekStart.slice(5)}
                    </span>
                    <span className='font-medium tabular-nums'>
                      {w.totalHours}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card padding='sm'>
            <p className='mb-3 text-xs font-medium text-text-tertiary'>
              {selectedDate ? `Day detail ${selectedDate}` : 'Select a day'}
            </p>
            {dayLoading ? (
              <div className='flex justify-center py-8'>
                <Loader2 className='h-5 w-5 animate-spin text-text-tertiary' />
              </div>
            ) : dayDetail ? (
              <div className='space-y-4'>
                {dayDetail.timeline && dayDetail.timeline.length > 0 && (
                  <div>
                    <p className='mb-2 text-xs font-medium text-text-tertiary'>
                      Time flow
                    </p>
                    <div className='max-h-48 space-y-1.5 overflow-y-auto'>
                      {dayDetail.timeline.map(block => {
                        const start = new Date(block.startTime)
                        const end = block.endTime
                          ? new Date(block.endTime)
                          : null
                        const timeLabel = `${start.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}${
                          end
                            ? ` – ${end.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}`
                            : ' – now'
                        }`
                        return (
                          <div
                            key={block._id}
                            className='flex items-start gap-2 rounded border border-border px-2 py-1.5'
                          >
                            <span
                              className='mt-1 h-2 w-2 shrink-0 rounded-full'
                              style={{ backgroundColor: block.colorHex }}
                            />
                            <div className='min-w-0 flex-1'>
                              <div className='flex items-center justify-between gap-2'>
                                <span className='truncate text-xs font-medium text-text-primary'>
                                  {block.projectName}
                                </span>
                                <span className='shrink-0 font-mono text-[11px] tabular-nums text-text-secondary'>
                                  {block.hours}
                                </span>
                              </div>
                              <p className='font-mono text-[10px] text-text-tertiary'>
                                {timeLabel}
                              </p>
                              {(block.processName || block.windowTitle) && (
                                <p className='truncate text-[10px] text-text-tertiary'>
                                  {[block.processName, block.windowTitle]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {dayDetail.breakdown.length === 0 ? (
                  <p className='text-sm text-text-tertiary'>No time logged</p>
                ) : (
                  dayDetail.breakdown.map(proj => (
                    <div key={proj.projectId}>
                      <div className='flex items-center gap-2'>
                        <span
                          className='h-2 w-2 rounded-full'
                          style={{ backgroundColor: proj.colorHex }}
                        />
                        <span className='text-sm font-medium'>
                          {proj.projectName}
                        </span>
                      </div>
                      {proj.users.map(u => (
                        <div
                          key={u.userId}
                          className='ml-4 mt-1 flex justify-between text-xs text-text-secondary'
                        >
                          <span>{u.displayName}</span>
                          <span className='tabular-nums'>{u.hours}</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}

                <div className='border-t border-border pt-4'>
                  <div className='mb-2 flex items-center gap-1.5 text-xs font-medium text-text-tertiary'>
                    <MessageSquare className='h-3.5 w-3.5' />
                    Comments
                  </div>
                  {dayComments.length === 0 ? (
                    <p className='mb-3 text-xs text-text-tertiary'>
                      No comments for this day
                    </p>
                  ) : (
                    <ul className='mb-3 max-h-32 space-y-2 overflow-y-auto'>
                      {dayComments.map(c => (
                        <li
                          key={c._id}
                          className='rounded border border-border px-2 py-1.5 text-xs'
                        >
                          <span className='font-medium text-text-primary'>
                            {c.userName}
                          </span>
                          <p className='text-text-secondary'>{c.text}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    rows={2}
                    placeholder='Add a note for this day...'
                    className='text-xs'
                  />
                  <Button
                    size='sm'
                    className='mt-2'
                    disabled={!commentText.trim() || commentSaving}
                    onClick={postDayComment}
                  >
                    {commentSaving ? (
                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
                    ) : (
                      'Add comment'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <p className='text-sm text-text-tertiary'>
                Click a calendar day to see the time flow, breakdown, and comments
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
