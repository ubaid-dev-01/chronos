import { getCurrentUser, setAuthCookies } from '@/lib/session';
import { connectDB, joinOrgViaInvite } from '@chronos/db';
import { NextResponse } from 'next/server';

/**
 * Accepts an invite for a user who is already signed in (existing account).
 * Distinct from `/accept`, which registers a brand-new account.
 */
export async function POST (
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    await connectDB();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Sign in to accept this invitation' },
        { status: 401 }
      );
    }

    const tokens = await joinOrgViaInvite({ token, userId: currentUser._id });
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
            INVALID_INVITE: 'Invitation not found or expired',
            INVALID_SESSION: 'Please sign in again',
            EMAIL_MISMATCH: 'This invitation was sent to a different email address',
            ORG_SUSPENDED: 'Workspace is suspended',
            SEAT_LIMIT: 'Workspace seat limit reached',
          }[err.message] ?? 'Could not join workspace'
        : 'Could not join workspace';

    const status =
      err instanceof Error && err.message === 'EMAIL_MISMATCH' ? 403 : 400;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
