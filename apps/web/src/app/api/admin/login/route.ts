import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB, PlatformAdmin } from '@chronos/db'
import { createSuperAdminSession } from '@/lib/superadmin'

export async function POST (request: Request) {
  try {
    const body = await request.json()
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase()
    const password = String(body.password ?? '')

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    await connectDB()

    const admin = await PlatformAdmin.findOne({ email, isActive: true }).select(
      '+passwordHash'
    )

    if (!admin?.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const valid = await bcrypt.compare(password, admin.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    admin.lastLoginAt = new Date()
    await admin.save()

    await createSuperAdminSession(email)

    return NextResponse.json({
      success: true,
      data: { email: admin.email, displayName: admin.displayName }
    })
  } catch (error) {
    console.error('Superadmin login error:', error)
    const message =
      error instanceof Error ? error.message : 'Login failed'
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'development'
            ? message
            : 'Login failed',
      },
      { status: 500 }
    )
  }
}
