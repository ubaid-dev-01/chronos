'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Users, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';
import { ElevatedButton } from '@/components/ui/elevated';
import {
  AuthCard,
  AuthField,
  authInputClassName,
} from '@/components/auth/auth-card';
import { PasswordInput } from '@/components/auth/password-input';

interface InvitePreview {
  email: string;
  role: string;
  orgName: string;
  permissions?: Record<string, boolean>;
}

const PERMISSION_LABELS: Record<string, string> = {
  tasksEnabled: 'Task tracking',
  screenshotsEnabled: 'Screenshot capture',
  canTrackOffline: 'Offline tracking',
  canDeleteScreenshots: 'Delete own screenshots',
  showPopupTimer: 'Floating timer popup',
  canManageTeam: 'Manage team',
  canLockTimetable: 'Lock timetables',
};

function RoleBadge ({ role }: { role: string }) {
  return (
    <span className='inline-flex items-center rounded-full border-2 border-[var(--elevated-ink)] bg-brand/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-brand'>
      {role}
    </span>
  );
}

function PermissionSummary ({ permissions }: { permissions?: Record<string, boolean> }) {
  if (!permissions) return null;
  const granted = Object.entries(permissions).filter(([, enabled]) => enabled);
  if (!granted.length) return null;

  return (
    <div className='mb-6 rounded-lg border border-border bg-surface-elevated/40 p-3'>
      <p className='mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-tertiary'>
        Your access will include
      </p>
      <ul className='space-y-1'>
        {granted.map(([key]) => (
          <li key={key} className='text-xs text-text-secondary'>
            · {PERMISSION_LABELS[key] ?? key}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AcceptInvitePage ({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const { user, loading: authLoading, refresh, logout } = useAuth();
  const [token, setToken] = useState('');
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/invites/${token}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setInvite(json.data);
        else setError(json.error || 'Invitation not found or expired');
      })
      .catch(() => setError('Could not load invitation'))
      .finally(() => setLoadingInvite(false));
  }, [token]);

  async function handleSubmit (e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ displayName, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          toast.error(
            json.error ||
              'An account with this email already exists. Sign in to continue.'
          );
          const params = new URLSearchParams({
            email: invite?.email ?? '',
            returnTo: `/invite/${token}`,
          });
          router.push(`/sign-in?${params.toString()}`);
          return;
        }
        toast.error(json.error || 'Failed to join');
        return;
      }
      toast.success(`Welcome to ${invite?.orgName}`);
      await refresh();
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Failed to join workspace');
    } finally {
      setSaving(false);
    }
  }

  async function handleJoinAsCurrentUser () {
    if (!token) return;
    setJoining(true);
    try {
      const res = await fetch(`/api/invites/${token}/join`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Could not join workspace');
        return;
      }
      toast.success(`Welcome to ${invite?.orgName}`);
      await refresh();
      router.push('/dashboard');
      router.refresh();
    } catch {
      toast.error('Could not join workspace');
    } finally {
      setJoining(false);
    }
  }

  async function handleSwitchAccounts () {
    await logout();
    const params = new URLSearchParams({
      email: invite?.email ?? '',
      returnTo: `/invite/${token}`,
    });
    router.push(`/sign-in?${params.toString()}`);
  }

  if (loadingInvite || authLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Loader2 className='h-6 w-6 animate-spin text-text-tertiary' />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <AuthCard className='text-center'>
        <div className='mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[var(--elevated-ink)] bg-danger/10 text-danger shadow-[2px_2px_0_0_var(--elevated-ink)]'>
          <ShieldAlert className='h-5 w-5' />
        </div>
        <h1 className='text-lg font-bold text-text-primary'>
          {error || 'Invitation not found or expired'}
        </h1>
        <p className='mt-2 text-sm text-text-secondary'>
          Ask whoever invited you to send a new invitation link.
        </p>
        <Link
          href='/sign-in'
          className='mt-4 inline-block text-sm font-semibold text-brand hover:underline'
        >
          Go to sign in
        </Link>
      </AuthCard>
    );
  }

  const loggedInAsInvitedEmail =
    !!user && user.email.toLowerCase() === invite.email.toLowerCase();
  const loggedInAsDifferentAccount = !!user && !loggedInAsInvitedEmail;

  return (
    <AuthCard>
      <div className='mb-6 text-center'>
        <div className='mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[var(--elevated-ink)] bg-brand/10 text-brand shadow-[2px_2px_0_0_var(--elevated-ink)]'>
          <Users className='h-5 w-5' />
        </div>
        <h1 className='text-2xl font-bold tracking-tight text-text-primary'>
          Join {invite.orgName}
        </h1>
        <p className='mt-2 text-sm text-text-secondary'>
          You&apos;re joining {invite.orgName} as <RoleBadge role={invite.role} />
        </p>
        <p className='mt-1 text-xs text-text-tertiary'>{invite.email}</p>
      </div>

      <PermissionSummary permissions={invite.permissions} />

      {loggedInAsDifferentAccount ? (
        <div className='space-y-4'>
          <div className='rounded-lg border border-border bg-surface-elevated/40 p-3 text-sm text-text-secondary'>
            You&apos;re currently signed in as <strong>{user!.email}</strong>,
            but this invitation was sent to <strong>{invite.email}</strong>.
            Sign out to accept it with the right account.
          </div>
          <ElevatedButton
            type='button'
            tone='primary'
            size='lg'
            className='w-full'
            onClick={handleSwitchAccounts}
          >
            Sign out &amp; switch accounts
          </ElevatedButton>
          <Link
            href='/dashboard'
            className='block text-center text-sm font-semibold text-brand hover:underline'
          >
            Stay signed in as {user!.email}
          </Link>
        </div>
      ) : loggedInAsInvitedEmail ? (
        <div className='space-y-4'>
          <p className='text-center text-sm text-text-secondary'>
            You&apos;re signed in as <strong>{user!.email}</strong>. Click below
            to join as {invite.role}.
          </p>
          <ElevatedButton
            type='button'
            tone='primary'
            size='lg'
            className='w-full'
            disabled={joining}
            onClick={handleJoinAsCurrentUser}
          >
            {joining ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Joining…
              </>
            ) : (
              `Join ${invite.orgName}`
            )}
          </ElevatedButton>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <AuthField label='Email' htmlFor='email'>
              <input
                id='email'
                type='email'
                value={invite.email}
                readOnly
                disabled
                className={`${authInputClassName} cursor-not-allowed opacity-70`}
              />
            </AuthField>
            <AuthField label='Full name' htmlFor='displayName'>
              <input
                id='displayName'
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoFocus
                className={authInputClassName}
              />
            </AuthField>
            <AuthField label='Password' htmlFor='password'>
              <PasswordInput
                id='password'
                value={password}
                onChange={setPassword}
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
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Joining…
                </>
              ) : (
                'Create account & join'
              )}
            </ElevatedButton>
          </form>

          <p className='mt-4 text-center text-sm text-text-secondary'>
            Already have an account?{' '}
            <Link
              href={`/sign-in?email=${encodeURIComponent(invite.email)}&returnTo=${encodeURIComponent(`/invite/${token}`)}`}
              className='font-semibold text-brand hover:underline'
            >
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthCard>
  );
}
