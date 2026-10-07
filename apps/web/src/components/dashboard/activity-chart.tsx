'use client'

import { Card } from '@/components/ui/card'
import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

interface ChartData {
  date: string
  activeHours: number
  idleHours: number
}

interface ActivityChartProps {
  data?: ChartData[]
}

export function ActivityChart ({ data: serverData }: ActivityChartProps) {
  // Derived directly from props during render no effect needed since this
  // is a pure transformation, not a sync with an external system.
  const data = useMemo<ChartData[]>(() => {
    if (serverData && serverData.length > 0) return serverData

    const days: ChartData[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({
        date: d.toLocaleDateString('en', { weekday: 'short' }),
        activeHours: 0,
        idleHours: 0
      })
    }
    return days
  }, [serverData])

  const hasData = data.some(d => d.activeHours > 0 || d.idleHours > 0)

  return (
    <Card>
      <h2 className='mb-5 text-sm font-medium text-text-primary'>
        Weekly activity
      </h2>
      {!hasData ? (
        <div className='flex h-64 items-center justify-center'>
          <p className='text-sm text-text-secondary'>
            Chart data will appear once tracking begins.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width='100%' height={280}>
          <BarChart data={data} barGap={2}>
            <CartesianGrid
              strokeDasharray='3 3'
              stroke='var(--border)'
              vertical={false}
            />
            <XAxis
              dataKey='date'
              stroke='var(--text-tertiary)'
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke='var(--text-tertiary)'
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            />
            <Bar
              dataKey='activeHours'
              name='Active'
              fill='var(--text-primary)'
              radius={[3, 3, 0, 0]}
              opacity={0.9}
            />
            <Bar
              dataKey='idleHours'
              name='Idle'
              fill='var(--text-tertiary)'
              radius={[3, 3, 0, 0]}
              opacity={0.5}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}
