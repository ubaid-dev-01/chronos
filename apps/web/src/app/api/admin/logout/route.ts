import { NextResponse } from 'next/server'
import { clearSuperAdminSession } from '@/lib/superadmin'

export async function POST () {
  await clearSuperAdminSession()
  return NextResponse.json({ success: true })
}
