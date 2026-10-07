'use client'

import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { useApiClient } from '@/hooks/use-api-client'
import { CalendarCheck, Flame, Loader2, Star, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'

type StreakBadge =
  | 'first_day'
  | 'three_day_streak'
  | 'week_warrior'
  | 'fortnight_focus'
  | 'month_master'
  | 'century_club'
  | 'most_focused_day'

const BADGE_INFO: Record<StreakBadge, { label: string; icon: string }> = {
  first_day: { label: 'First day', icon: '🌱' },
  three_day_streak: { label: '3-day streak', icon: '🔥' },
  week_warrior: { label: 'Week warrior', icon: '🗓️' },
  fortnight_focus: { label: 'Fortnight focus', icon: '🎯' },
  month_master: { label: 'Month master', icon: '🏆' },
  century_club: { label: 'Century club', icon: '💯' },
  most_focused_day: { label: 'Most focused day', icon: '⭐' }
}

interface MyAchievements {
  currentStreak: number
  longestStreak: number
  totalActiveDays: number
  lastActiveDate: string | null
  bestDayHours: number
  bestDayDate: string | null
  badges: StreakBadge[]
  streakActive: boolean
}

interface LeaderboardRow {
  userId: string
  displayName: string
  currentStreak: number
  longestStreak: number
  totalActiveDays: number
  bestDayHours: number
  badges: StreakBadge[]
  streakActive: boolean
}

export default function AchievementsPage () {
  const { apiFetch } = useApiClient()
  const [mine, setMine] = useState<MyAchievements | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    queueMicrotask(() => {
      Promise.all([
        apiFetch<{ data: MyAchievements }>('/achievements/me'),
        apiFetch<{ data: LeaderboardRow[] }>('/achievements/leaderboard')
      ])
        .then(([me, board]) => {
          setMine(me.data)
          setLeaderboard(board.data)
        })
        .catch(() => {
          setMine(null)
          setLeaderboard([])
        })
        .finally(() => setLoading(false))
    })
  }, [apiFetch])

  if (loading) {
    return (
      <div className='flex justify-center py-24'>
        <Loader2 className='h-6 w-6 animate-spin text-text-tertiary' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Achievements'
        description='Daily work streaks, badges, and the org leaderboard'
      />

      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <Card padding='md'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-text-secondary'>Current streak</p>
            <Flame
              className={`h-4 w-4 ${
                mine?.streakActive ? 'text-warning' : 'text-text-tertiary'
              }`}
            />
          </div>
          <p className='mt-2 font-mono text-3xl font-medium tracking-tight text-text-primary'>
            {mine?.currentStreak ?? 0}
            <span className='text-sm text-text-tertiary'> days</span>
          </p>
        </Card>
        <Card padding='md'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-text-secondary'>Longest streak</p>
            <Trophy className='h-4 w-4 text-text-tertiary' />
          </div>
          <p className='mt-2 font-mono text-3xl font-medium tracking-tight text-text-primary'>
            {mine?.longestStreak ?? 0}
            <span className='text-sm text-text-tertiary'> days</span>
          </p>
        </Card>
        <Card padding='md'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-text-secondary'>Active days</p>
            <CalendarCheck className='h-4 w-4 text-text-tertiary' />
          </div>
          <p className='mt-2 font-mono text-3xl font-medium tracking-tight text-text-primary'>
            {mine?.totalActiveDays ?? 0}
          </p>
        </Card>
        <Card padding='md'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-text-secondary'>Best day</p>
            <Star className='h-4 w-4 text-text-tertiary' />
          </div>
          <p className='mt-2 font-mono text-3xl font-medium tracking-tight text-text-primary'>
            {(mine?.bestDayHours ?? 0).toFixed(1)}h
          </p>
        </Card>
      </div>

      <Card padding='md'>
        <p className='mb-3 text-xs font-medium text-text-tertiary'>
          Your badges
        </p>
        {!mine || mine.badges.length === 0 ? (
          <p className='text-sm text-text-tertiary'>
            No badges yet track time today to start your streak.
          </p>
        ) : (
          <div className='flex flex-wrap gap-3'>
            {mine.badges.map(badge => (
              <div
                key={badge}
                className='flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1.5'
              >
                <span className='text-base'>{BADGE_INFO[badge].icon}</span>
                <span className='text-xs font-medium text-text-primary'>
                  {BADGE_INFO[badge].label}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding='none'>
        <div className='border-b border-border px-4 py-3'>
          <p className='text-xs font-medium text-text-tertiary'>
            Streak leaderboard
          </p>
        </div>
        {leaderboard.length === 0 ? (
          <p className='px-4 py-10 text-center text-sm text-text-tertiary'>
            No streaks recorded yet
          </p>
        ) : (
          <ul className='divide-y divide-border'>
            {leaderboard.map((row, i) => (
              <li
                key={row.userId}
                className='flex items-center justify-between px-4 py-3'
              >
                <div className='flex items-center gap-3'>
                  <span className='w-5 text-right text-xs font-mono text-text-tertiary'>
                    {i + 1}
                  </span>
                  <p className='text-sm font-medium text-text-primary'>
                    {row.displayName}
                  </p>
                  <span className='text-xs text-text-tertiary'>
                    {row.badges.length} badge
                    {row.badges.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <Flame
                    className={`h-3.5 w-3.5 ${
                      row.streakActive ? 'text-warning' : 'text-text-tertiary'
                    }`}
                  />
                  <span className='font-mono text-sm font-medium text-text-primary'>
                    {row.currentStreak}
                  </span>
                  <span className='text-xs text-text-tertiary'>days</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
