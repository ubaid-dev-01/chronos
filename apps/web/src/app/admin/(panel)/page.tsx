import { connectDB, Organization, User, mongoose } from '@chronos/db'
import type { PlanTier } from '@chronos/types'
import { PLANS } from '@chronos/types'
import { Building2, Users, Layers, DollarSign, Database, Server } from 'lucide-react'

async function getOverview () {
  await connectDB()
  const dbOk = mongoose.connection.readyState === 1

  const [orgTotal, orgActive, userTotal, userActive, planAgg] =
    await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ isActive: true }),
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Organization.aggregate<{ _id: PlanTier; count: number }>([
        { $group: { _id: '$planTier', count: { $sum: 1 } } }
      ])
    ])

  const plans: Record<PlanTier, number> = {
    free: 0,
    starter: 0,
    pro: 0,
    enterprise: 0
  }
  for (const row of planAgg) {
    if (row._id in plans) plans[row._id] = row.count
  }

  const mrrCents = (Object.entries(plans) as [PlanTier, number][]).reduce(
    (sum, [tier, count]) => {
      const plan = PLANS.find(p => p.tier === tier)
      return sum + (plan ? plan.price * count : 0)
    },
    0
  )

  return {
    organizations: { total: orgTotal, active: orgActive },
    users: { total: userTotal, active: userActive },
    plans,
    mrr: mrrCents / 100,
    system: { dbOk }
  }
}

export default async function SuperAdminOverviewPage () {
  const stats = await getOverview()

  const cards = [
    {
      label: 'Organizations',
      value: stats.organizations.total,
      sub: `${stats.organizations.active} active`,
      icon: Building2
    },
    {
      label: 'Users',
      value: stats.users.total,
      sub: `${stats.users.active} active`,
      icon: Users
    },
    {
      label: 'Paid workspaces',
      value:
        stats.plans.starter + stats.plans.pro + stats.plans.enterprise,
      sub: `${stats.plans.free} on free`,
      icon: Layers
    },
    {
      label: 'MRR',
      value: `$${stats.mrr.toLocaleString()}`,
      sub: 'Estimated monthly revenue',
      icon: DollarSign
    }
  ]

  return (
    <div className='space-y-6 sm:space-y-8'>
      <div>
        <p className='label-caps mb-2 text-brand'>Platform</p>
        <h1 className='heading-section text-text-primary'>Overview</h1>
        <p className='prose-body mt-2 max-w-xl'>
          SaaS-wide metrics across all Chronos workspaces.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {cards.map(card => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className='rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-5 shadow-[0_4px_0_0_var(--elevated-ink)] sm:p-6'
            >
              <div className='mb-4 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[var(--elevated-ink)] bg-brand/10 text-brand'>
                <Icon className='h-5 w-5' />
              </div>
              <p className='text-sm text-text-tertiary'>{card.label}</p>
              <p className='mt-1 font-mono text-2xl font-bold text-text-primary sm:text-3xl'>
                {card.value}
              </p>
              <p className='mt-1 text-xs text-text-secondary'>{card.sub}</p>
            </div>
          )
        })}
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <div className='rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-5 shadow-[0_4px_0_0_var(--elevated-ink)] sm:p-6 lg:col-span-2'>
          <h2 className='mb-4 text-lg font-semibold text-text-primary'>
            Plan distribution
          </h2>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {(Object.entries(stats.plans) as [PlanTier, number][]).map(
              ([tier, count]) => (
                <div
                  key={tier}
                  className='rounded-xl border-2 border-border bg-surface-elevated px-4 py-3'
                >
                  <p className='text-xs font-semibold uppercase tracking-wide text-text-tertiary'>
                    {tier}
                  </p>
                  <p className='mt-1 font-mono text-2xl font-bold text-text-primary'>
                    {count}
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        <div className='rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-5 shadow-[0_4px_0_0_var(--elevated-ink)] sm:p-6'>
          <h2 className='mb-4 text-lg font-semibold text-text-primary'>
            System health
          </h2>
          <div className='space-y-3'>
            <div className='flex items-center justify-between rounded-xl border-2 border-border bg-surface-elevated px-4 py-3'>
              <span className='flex items-center gap-2 text-sm text-text-secondary'>
                <Database className='h-4 w-4' /> Database
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  stats.system.dbOk
                    ? 'bg-success/15 text-success'
                    : 'bg-danger/15 text-danger'
                }`}
              >
                {stats.system.dbOk ? 'Connected' : 'Unreachable'}
              </span>
            </div>
            <div className='flex items-center justify-between rounded-xl border-2 border-border bg-surface-elevated px-4 py-3'>
              <span className='flex items-center gap-2 text-sm text-text-secondary'>
                <Server className='h-4 w-4' /> Environment
              </span>
              <span className='rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-brand'>
                {process.env.NODE_ENV ?? 'unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
