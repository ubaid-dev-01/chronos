'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';
import { ElevatedButton } from '@/components/ui/elevated';
import {
  AuthCard,
  AuthField,
  AuthHeader,
  authInputClassName,
} from '@/components/auth/auth-card';
import { PasswordInput } from '@/components/auth/password-input';

export default function SignInPage () {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm () {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Set when arriving from an invite link for an already-registered email
  // (see /invite/[token]) so we can send the user straight back to finish
  // joining the workspace instead of dropping them on the generic dashboard.
  const returnTo = searchParams.get('returnTo');
  const fromInvite = returnTo?.startsWith('/invite/');

  async function handleSubmit (e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Sign in failed');
        return;
      }
      toast.success('Welcome back');
      await refresh();
      router.push(returnTo || '/dashboard');
      router.refresh();
    } catch {
      toast.error('Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <AuthHeader
        title='Welcome back'
        description={
          fromInvite
            ? "Sign in to finish accepting your invitation"
            : 'Sign in to your Chronos workspace'
        }
      />
      {fromInvite && (
        <div className='mb-6 rounded-lg border border-border bg-surface-elevated/40 p-3 text-xs text-text-secondary'>
          You already have a Chronos account for this email. Sign in and
          we&apos;ll take you back to accept the invitation.
        </div>
      )}
      <form onSubmit={handleSubmit} className='space-y-4'>
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
        <AuthField
          label='Password'
          htmlFor='password'
          hint={
            <Link
              href='/forgot-password'
              className='text-xs font-medium text-brand hover:underline'
            >
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id='password'
            value={password}
            onChange={setPassword}
            autoComplete='current-password'
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
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </ElevatedButton>
      </form>
      <p className='mt-6 text-center text-sm text-text-secondary'>
        No account?{' '}
        <Link href='/sign-up' className='font-semibold text-brand hover:underline'>
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}
