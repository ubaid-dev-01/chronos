import { NextResponse } from 'next/server';
import { connectDB, revokeRefreshToken } from '@chronos/db';
import {
  clearAuthCookies,
  getRefreshTokenFromCookies,
} from '@/lib/session';

export async function POST () {
  const refresh = await getRefreshTokenFromCookies();
  if (refresh) {
    await connectDB();
    await revokeRefreshToken(refresh);
  }
  await clearAuthCookies();
  return NextResponse.json({ success: true });
}
