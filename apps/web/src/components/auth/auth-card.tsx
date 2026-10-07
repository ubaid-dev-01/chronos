import { cn } from '@/lib/utils';

export function AuthCard ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'w-full max-w-md rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-8 shadow-[0_6px_0_0_var(--elevated-ink)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function AuthHeader ({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className='mb-6 text-center'>
      <h1 className='text-2xl font-bold tracking-tight text-text-primary'>
        {title}
      </h1>
      <p className='mt-2 text-sm text-text-secondary'>{description}</p>
    </div>
  );
}

export function AuthField ({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div>
      <div className='mb-1.5 flex items-center justify-between gap-2'>
        <label
          htmlFor={htmlFor}
          className='block text-sm font-medium text-text-secondary'
        >
          {label}
        </label>
        {hint}
      </div>
      {children}
    </div>
  );
}

export const authInputClassName =
  'w-full rounded-xl border-2 border-[var(--elevated-ink)] bg-surface-elevated px-4 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-brand';
