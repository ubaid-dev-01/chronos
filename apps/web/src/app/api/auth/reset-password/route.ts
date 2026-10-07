import { NextResponse } from 'next/server';
import { connectDB, resetPasswordWithOtp } from '@chronos/db';

export async function POST (request: Request) {
  try {
    const { email, otp, password } = await request.json();
    if (!email || !otp || !password) {
      return NextResponse.json(
        { success: false, error: 'Email, OTP, and password are required' },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    if (!/^\d{6}$/.test(String(otp).trim())) {
      return NextResponse.json(
        { success: false, error: 'Enter the 6-digit verification code' },
        { status: 400 }
      );
    }

    await connectDB();
    await resetPasswordWithOtp(email, String(otp).trim(), password);

    return NextResponse.json({
      success: true,
      message: 'Password updated. You can sign in now.',
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'INVALID_RESET_OTP') {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }
    console.error('Reset password error:', err);
    const message = err instanceof Error ? err.message : 'Reset failed';
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development' ? message : 'Reset failed',
      },
      { status: 500 }
    );
  }
}
