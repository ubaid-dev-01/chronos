import { NextResponse } from 'next/server'
import { connectDB, Organization, User } from '@chronos/db'
import type { PlanTier, PlatformStats } from '@chronos/types'
import { requireSuperAdmin } from '@/lib/superadmin'

export async function GET () {
  try {
    await requireSuperAdmin()
    await connectDB()

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
      if (row._id in plans) {
        plans[row._id] = row.count
      }
    }

    const stats: PlatformStats = {
      organizations: { total: orgTotal, active: orgActive },
      users: { total: userTotal, active: userActive },
      plans
    }

    return NextResponse.json({ success: true, data: stats })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
}
