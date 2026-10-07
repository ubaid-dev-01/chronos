import { NextResponse } from 'next/server';
import { connectDB, User, refreshWithToken, verifyAccessToken } from '@chronos/db';
import {
  getRefreshTokenFromCookies,
  setAuthCookies,
  clearAuthCookies,
} from '@/lib/session';

export async function POST () {
  try {
    const refresh = await getRefreshTokenFromCookies();
    if (!refresh) {
      return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    }

    await connectDB();
    const tokens = await refreshWithToken(refresh);
    await setAuthCookies(tokens.accessToken, tokens.refreshToken);

    const payload = await verifyAccessToken(tokens.accessToken);
    const user = (await User.findById(payload.sub)
      .select('displayName email role')
      .lean()) as { _id: unknown; email: string; role: string; displayName: string } | null;

    return NextResponse.json({
      success: true,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
      user: user
        ? {
            _id: String(user._id),
            email: user.email,
            role: user.role,
            displayName: user.displayName,
          }
        : null,
    });
  } catch {
    await clearAuthCookies();
    return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 });
  }
}
