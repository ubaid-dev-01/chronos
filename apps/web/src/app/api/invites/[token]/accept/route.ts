import { setAuthCookies } from '@/lib/session';
import { connectDB, registerViaInvite } from '@chronos/db';
import { NextResponse } from 'next/server';

export async function POST (
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { displayName, password } = await request.json();

    if (!displayName || !password) {
      return NextResponse.json(
        { success: false, error: 'Name and password required' },
        { status: 400 }
      );
    }

    await connectDB();
    const tokens = await registerViaInvite({ token, displayName, password });
    await setAuthCookies(tokens.accessToken, tokens.refreshToken);

    return NextResponse.json({
      success: true,
      accessToken: tokens.accessToken,
      expiresIn: tokens.expiresIn,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? {
            EMAIL_EXISTS: 'Account already exists sign in instead',
            INVALID_INVITE: 'Invitation not found or expired',
            ORG_SUSPENDED: 'Workspace is suspended',
            SEAT_LIMIT: 'Workspace seat limit reached',
          }[err.message] ?? 'Could not accept invitation'
        : 'Could not accept invitation';

    const status =
      err instanceof Error && err.message === 'EMAIL_EXISTS' ? 409 : 400;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
