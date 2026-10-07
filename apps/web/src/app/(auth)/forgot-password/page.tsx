'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ElevatedButton } from '@/components/ui/elevated';
import { AuthCard, AuthField, AuthHeader, authInputClassName } from '@/components/auth/auth-card';
import { OtpInput } from '@/components/auth/otp-input';
import { PasswordInput } from '@/components/auth/password-input';

type Step = 'email' | 'otp' | 'password';

export default function ForgotPasswordPage () {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);

  async function sendOtp (e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setEmailPreviewUrl(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Request failed');
        return;
      }
      toast.success(json.message || 'Verification code sent to your email');
      if (json.emailPreviewUrl) setEmailPreviewUrl(json.emailPreviewUrl);
      setStep('otp');
    } catch {
      toast.error('Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp (e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Invalid verification code');
        return;
      }
      setStep('password');
    } catch {
      toast.error('Could not verify code');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword (e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Reset failed');
        if (res.status === 400 && json.error?.includes('verification code')) {
          setStep('otp');
        }
        return;
      }
      toast.success('Password updated');
      router.push('/sign-in');
    } catch {
      toast.error('Reset failed');
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp () {
    setLoading(true);
    setEmailPreviewUrl(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Could not resend code');
        return;
      }
      setOtp('');
      if (json.emailPreviewUrl) setEmailPreviewUrl(json.emailPreviewUrl);
      toast.success(json.message || 'New code sent to your email');
    } catch {
      toast.error('Could not resend code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <AuthHeader
        title={
          step === 'email'
            ? 'Forgot password'
            : step === 'otp'
              ? 'Check your email'
              : 'Set new password'
        }
        description={
          step === 'email'
            ? 'Enter your email and we will send a verification code'
            : step === 'otp'
              ? `Enter the 6-digit code sent to ${email}`
              : 'Choose a strong password for your account'
        }
      />

      {step === 'email' && (
        <form onSubmit={sendOtp} className='space-y-4'>
          <AuthField label='Email' htmlFor='email'>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='you@company.com'
              autoComplete='email'
              required
              className={authInputClassName}
            />
          </AuthField>
          <ElevatedButton
            type='submit'
            tone='primary'
            size='lg'
            className='w-full'
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Sending code…
              </>
            ) : (
              'Send verification code'
            )}
          </ElevatedButton>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={verifyOtp} className='space-y-5'>
          <OtpInput value={otp} onChange={setOtp} disabled={loading} />
          {emailPreviewUrl && (
            <div className='rounded-lg border border-brand/30 bg-brand/10 px-3 py-3 text-center text-sm text-text-secondary'>
              <p className='mb-2'>
                Your OTP was sent to a dev test inbox. Click below to open the
                email and copy the 6-digit code.
              </p>
              <a
                href={emailPreviewUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex font-semibold text-brand hover:underline'
              >
                Open email →
              </a>
            </div>
          )}
          <ElevatedButton
            type='submit'
            tone='primary'
            size='lg'
            className='w-full'
            disabled={loading || otp.length !== 6}
          >
            Continue
          </ElevatedButton>
          <div className='flex items-center justify-between text-sm'>
            <button
              type='button'
              onClick={() => setStep('email')}
              className='font-medium text-text-secondary hover:text-text-primary'
            >
              Change email
            </button>
            <button
              type='button'
              onClick={resendOtp}
              disabled={loading}
              className='font-semibold text-brand hover:underline disabled:opacity-50'
            >
              Resend code
            </button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={resetPassword} className='space-y-4'>
          <AuthField label='New password' htmlFor='password'>
            <PasswordInput
              id='password'
              value={password}
              onChange={setPassword}
              minLength={8}
              autoComplete='new-password'
              required
            />
          </AuthField>
          <AuthField label='Confirm password' htmlFor='confirmPassword'>
            <PasswordInput
              id='confirmPassword'
              value={confirmPassword}
              onChange={setConfirmPassword}
              minLength={8}
              autoComplete='new-password'
              required
            />
          </AuthField>
          <ElevatedButton
            type='submit'
            tone='primary'
            size='lg'
            className='w-full'
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Updating…
              </>
            ) : (
              'Update password'
            )}
          </ElevatedButton>
          <button
            type='button'
            onClick={() => setStep('otp')}
            className='w-full text-sm font-medium text-text-secondary hover:text-text-primary'
          >
            Back to verification code
          </button>
        </form>
      )}

      <p className='mt-6 text-center text-sm text-text-secondary'>
        <Link href='/sign-in' className='font-semibold text-brand hover:underline'>
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
