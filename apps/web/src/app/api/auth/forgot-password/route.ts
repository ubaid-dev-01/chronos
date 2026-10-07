import { NextResponse } from 'next/server';
import { connectDB, createPasswordResetOtp, PasswordReset, User } from '@chronos/db';
import { getApiV1Url } from '@/lib/api-url';

async function invalidateLatestOtp (email: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalized });
  if (!user) return;

  await PasswordReset.updateMany(
    { userId: user._id, usedAt: null },
    { usedAt: new Date() }
  );
}

async function sendOtpViaApi (to: string, otp: string) {
  const secret =
    process.env.INTERNAL_EMAIL_SECRET || 'chronos-dev-internal-email-secret';

  const response = await fetch(getApiV1Url('/auth/password-reset/email'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Chronos-Internal': secret,
    },
    body: JSON.stringify({ to, otp }),
  }).catch(() => {
    throw new Error(
      'Email service unavailable. Make sure the API server is running on port 4000.'
    );
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json?.error || json?.message || 'Failed to send email');
  }

  return json.data as { mode?: string; previewUrl?: string };
}

export async function POST (request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalized = email.toLowerCase().trim();

    await connectDB();
    const { otp } = await createPasswordResetOtp(email);

    let delivery: { mode?: string; previewUrl?: string };
    try {
      delivery = await sendOtpViaApi(normalized, otp);
    } catch (emailErr) {
      await invalidateLatestOtp(email);
      throw emailErr;
    }

    return NextResponse.json({
      success: true,
      message:
        delivery.mode === 'ethereal'
          ? 'Verification email sent (dev test inbox). Open the preview link below.'
          : 'Verification code sent to your email.',
      emailPreviewUrl:
        process.env.NODE_ENV === 'development'
          ? delivery.previewUrl
          : undefined,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'EMAIL_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: 'No account found with this email address',
        },
        { status: 404 }
      );
    }
    if (err instanceof Error && err.message === 'ACCOUNT_DEACTIVATED') {
      return NextResponse.json(
        {
          success: false,
          error: 'This account has been deactivated. Contact your admin.',
        },
        { status: 403 }
      );
    }

    console.error('Forgot password error:', err);
    const message = err instanceof Error ? err.message : 'Request failed';
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'development' ? message : 'Request failed',
      },
      { status: 500 }
    );
  }
}
