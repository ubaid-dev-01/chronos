import nodemailer from 'nodemailer';
import { randomUUID } from 'crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

function getSmtpFrom (): string {
  if (env.SMTP_USER) return `Chronos <${env.SMTP_USER}>`;
  return env.EMAIL_FROM || 'Chronos <onboarding@resend.dev>';
}

function getTransporter (): nodemailer.Transporter | null {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export type EmailMode = 'resend' | 'smtp' | 'ethereal' | 'console';

export type EmailSendResult = {
  sent: boolean;
  mode: EmailMode;
  previewUrl?: string;
};

const RESEND_SANDBOX_DOMAIN = 'resend.dev';
let warnedAboutSandboxDomain = false;

/**
 * `onboarding@resend.dev` is Resend's shared sandbox sender. It has no
 * SPF/DKIM alignment with our own brand and is used by countless other
 * apps, so mailbox providers routinely flag it as spam/phishing for real
 * recipients. This only warns (once) so operators notice it in logs;
 * see apps/api/.env for the domain-verification steps required to fix it.
 */
function warnIfUsingSandboxDomain (from: string): void {
  if (warnedAboutSandboxDomain || !from.includes(RESEND_SANDBOX_DOMAIN)) return;
  warnedAboutSandboxDomain = true;
  logger.warn(
    'Sending email from the unverified Resend sandbox domain (resend.dev). ' +
      'These emails are very likely to land in spam for real recipients. ' +
      'Verify your own domain at https://resend.com/domains and set EMAIL_FROM to an address on it.'
  );
}

async function sendViaEthereal (input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<string | null> {
  if (env.NODE_ENV === 'production') return null;

  const testAccount = await nodemailer.createTestAccount();
  const transport = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });

  const info = await transport.sendMail({
    from: `"Chronos" <${testAccount.user}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  return nodemailer.getTestMessageUrl(info) ?? null;
}

export async function sendEmail (input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<EmailSendResult> {
  const from = env.EMAIL_FROM || 'Chronos <onboarding@resend.dev>';
  warnIfUsingSandboxDomain(from);

  if (env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(env.EMAIL_REPLY_TO ? { reply_to: env.EMAIL_REPLY_TO } : {}),
        // Improves inbox placement: real headers instead of an unbranded
        // sender-only message make the email look less like bulk/spam mail.
        headers: {
          'X-Entity-Ref-ID': randomUUID(),
        },
      }),
    });

    if (response.ok) {
      logger.info('Email sent via Resend', { to: input.to });
      return { sent: true, mode: 'resend' };
    }

    const body = await response.text();
    const sandboxBlocked =
      response.status === 403 && body.includes('validation_error');

    if (!sandboxBlocked) {
      logger.error('Resend email failed', { status: response.status, body });
      throw new Error(`Failed to send email (${response.status})`);
    }

    logger.warn('Resend sandbox blocked recipient; trying SMTP fallback', {
      to: input.to,
    });
  }

  const transport = getTransporter();
  if (transport) {
    await transport.sendMail({
      from: getSmtpFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...(env.EMAIL_REPLY_TO ? { replyTo: env.EMAIL_REPLY_TO } : {}),
    });
    return { sent: true, mode: 'smtp' };
  }

  const previewUrl = await sendViaEthereal(input);
  if (previewUrl) {
    logger.info('Email sent via Ethereal (dev)', { to: input.to, previewUrl });
    return { sent: true, mode: 'ethereal', previewUrl };
  }

  if (env.RESEND_API_KEY) {
    throw new Error(
      'Cannot send to this email until SMTP is configured or your domain is verified in Resend.'
    );
  }

  logger.info('[email:dev] Would send email', {
    to: input.to,
    subject: input.subject,
    preview: input.text ?? input.html.slice(0, 200),
  });
  return { sent: false, mode: 'console' };
}

/**
 * Shared branded footer. Consistent sender identity + a real physical/
 * organizational reason for the email are both positive signals mailbox
 * providers use to compute spam scores, and they make the mail feel like
 * legitimate product mail rather than an anonymous blast.
 */
function emailFooterHtml (reason: string): string {
  return `
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;line-height:1.6">
      <p style="margin:0">${reason}</p>
      <p style="margin:8px 0 0">Chronos &mdash; privacy-first time tracking for teams.</p>
    </div>
  `;
}

function emailWrapperHtml (bodyHtml: string, preheader: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,system-ui,sans-serif;max-width:520px;margin:0 auto;color:#111;line-height:1.5">
      <span style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</span>
      ${bodyHtml}
    </div>
  `;
}

export async function sendPasswordResetOtpEmail (input: {
  to: string;
  otp: string;
}) {
  const subject = 'Your Chronos password reset code';
  const text = [
    'You requested a password reset for your Chronos account.',
    `Your verification code is: ${input.otp}`,
    'This code expires in 10 minutes.',
    'If you did not request this, you can safely ignore this email — your password will not change.',
  ].join('\n\n');

  const html = emailWrapperHtml(
    `
      <h2 style="color:#6C2BD9;margin-bottom:4px">Reset your password</h2>
      <p>You requested a password reset for your Chronos account.</p>
      <p style="margin:28px 0;font-size:32px;font-weight:700;letter-spacing:0.35em;color:#6C2BD9">${input.otp}</p>
      <p style="font-size:14px;color:#666">Enter this code on the forgot password page. It expires in 10 minutes.</p>
      ${emailFooterHtml(
        `You're receiving this because a password reset was requested for ${input.to}. If this wasn't you, no action is needed.`
      )}
    `,
    `Your Chronos verification code is ${input.otp}`
  );

  return sendEmail({ to: input.to, subject, html, text });
}

export async function sendInviteEmail (input: {
  to: string;
  orgName: string;
  role: string;
  inviteUrl: string;
  inviterName?: string;
  permissions?: Record<string, boolean>;
}) {
  const subject = `${input.inviterName ?? 'A teammate'} invited you to ${input.orgName} on Chronos`;
  const grantedPermissions = input.permissions
    ? Object.entries(input.permissions)
        .filter(([, enabled]) => enabled)
        .map(([key]) => humanizePermissionKey(key))
    : [];

  const text = [
    `You've been invited to join ${input.orgName} on Chronos as ${input.role}.`,
    input.inviterName ? `Invited by ${input.inviterName}.` : '',
    grantedPermissions.length ? `Your access includes: ${grantedPermissions.join(', ')}.` : '',
    `Accept your invitation here: ${input.inviteUrl}`,
    'This link expires in 7 days.',
    "If you weren't expecting this invitation, you can ignore this email.",
  ]
    .filter(Boolean)
    .join('\n\n');

  const permissionsHtml = grantedPermissions.length
    ? `
      <ul style="font-size:13px;color:#444;padding-left:18px;margin:12px 0">
        ${grantedPermissions.map((p) => `<li>${p}</li>`).join('')}
      </ul>
    `
    : '';

  const html = emailWrapperHtml(
    `
      <h2 style="color:#6C2BD9;margin-bottom:4px">Join ${input.orgName} on Chronos</h2>
      <p>You've been invited as <strong>${input.role}</strong>${
        input.inviterName ? ` by ${input.inviterName}` : ''
      }.</p>
      <p style="color:#444">Chronos helps your team track time on assigned work and verify progress with privacy-first screenshots.</p>
      ${permissionsHtml}
      <p style="margin:28px 0">
        <a href="${input.inviteUrl}" style="background:#6C2BD9;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
          Accept invitation
        </a>
      </p>
      <p style="font-size:12px;color:#666">Or copy this link into your browser:<br><a href="${input.inviteUrl}" style="color:#6C2BD9">${input.inviteUrl}</a></p>
      <p style="font-size:12px;color:#999">This invitation expires in 7 days.</p>
      ${emailFooterHtml(
        `You're receiving this because ${input.inviterName ?? 'someone'} invited ${input.to} to join their team on Chronos. If you weren't expecting this, you can ignore this email.`
      )}
    `,
    `${input.inviterName ?? 'A teammate'} invited you to join ${input.orgName} on Chronos`
  );

  return sendEmail({ to: input.to, subject, html, text });
}

function humanizePermissionKey (key: string): string {
  const labels: Record<string, string> = {
    canTrackOffline: 'Track time while offline',
    canDeleteScreenshots: 'Delete own screenshots',
    showPopupTimer: 'Floating timer popup',
    screenshotsEnabled: 'Screenshots menu + capture',
    tasksEnabled: 'Tasks menu',
    reportsEnabled: 'Reports menu',
    activityEnabled: 'Activity menu',
    insightsEnabled: 'Insights menus',
    commentsEnabled: 'Comments menu',
    canManageTeam: 'Manage team members',
    canLockTimetable: 'Lock weekly timetables',
  };
  return labels[key] ?? key;
}
