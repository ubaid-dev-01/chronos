import { NextResponse } from 'next/server';
import { connectDB, registerWithPassword, User, verifyAccessToken } from '@chronos/db';
import { setAuthCookies } from '@/lib/session';

export async function POST (request: Request) {
  try {
    const { email, password, displayName, workspaceName } = await request.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    await connectDB();
    const tokens = await registerWithPassword({
      email,
      password,
      displayName,
      workspaceName,
    });
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
    if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }
    const code = (err as { code?: number })?.code;
    if (code === 11000) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      );
    }
    console.error('Registration error:', err);
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'development' ? message : 'Registration failed',
      },
      { status: 500 }
    );
  }
}
