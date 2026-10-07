import { NextResponse } from 'next/server'
import { connectDB, Organization } from '@chronos/db'
import type { PlanTier } from '@chronos/types'
import { PLANS } from '@chronos/types'
import { requireSuperAdmin } from '@/lib/superadmin'

const PLAN_TIERS: PlanTier[] = ['free', 'starter', 'pro', 'enterprise']

export async function PATCH (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
    const { id } = await params
    const body = await request.json()

    await connectDB()

    const updates: Record<string, unknown> = {}
    if (typeof body.isActive === 'boolean') updates.isActive = body.isActive
    if (typeof body.planTier === 'string' && PLAN_TIERS.includes(body.planTier)) {
      updates.planTier = body.planTier
      const plan = PLANS.find((p) => p.tier === body.planTier)
      if (plan && body.seatLimit === undefined) {
        updates.seatLimit = plan.seatLimit
      }
    }
    if (typeof body.seatLimit === 'number' && body.seatLimit >= 1) {
      updates.seatLimit = Math.floor(body.seatLimit)
    }
    if (typeof body.seatLimit === 'string') {
      const parsed = parseInt(body.seatLimit, 10)
      if (!Number.isNaN(parsed) && parsed >= 1) updates.seatLimit = parsed
    }

    const org = (await Organization.findByIdAndUpdate(id, updates, {
      new: true
    }).lean()) as {
      _id: unknown
      name: string
      planTier: string
      seatLimit: number
      isActive: boolean
    } | null

    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: String(org._id),
        name: org.name,
        planTier: org.planTier,
        seatLimit: org.seatLimit,
        isActive: org.isActive
      }
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
}
