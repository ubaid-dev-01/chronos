import { NextResponse } from 'next/server';
import { connectDB, verifyPasswordResetOtp } from '@chronos/db';

export async function POST (request: Request) {
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and verification code are required' },
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
    await verifyPasswordResetOtp(email, String(otp).trim());
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'INVALID_RESET_OTP') {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Could not verify code' },
      { status: 500 }
    );
  }
}
