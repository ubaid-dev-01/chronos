import { NextResponse } from 'next/server';
import { connectDB, loginWithPassword, User, verifyAccessToken } from '@chronos/db';
import { setAuthCookies } from '@/lib/session';

export async function POST (request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password required' },
        { status: 400 }
      );
    }

    await connectDB();
    const tokens = await loginWithPassword(email, password);
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
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.message === 'ACCOUNT_DEACTIVATED'
        ? 'Account deactivated'
        : 'Invalid email or password';
    const status =
      err instanceof Error && err.message === 'ACCOUNT_DEACTIVATED' ? 403 : 401;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
