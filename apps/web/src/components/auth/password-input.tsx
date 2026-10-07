'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PasswordInput ({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  function toggleVisible () {
    setVisible((current) => !current);
  }

  return (
    <div
      className={cn(
        'flex w-full items-stretch overflow-hidden rounded-xl border-2 border-[var(--elevated-ink)] bg-surface-elevated transition-colors focus-within:border-brand',
        className
      )}
    >
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        data-1p-ignore
        data-lpignore='true'
        className='min-w-0 flex-1 border-0 bg-transparent px-4 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary'
      />
      <button
        type='button'
        onClick={toggleVisible}
        onMouseDown={(e) => e.preventDefault()}
        className='flex shrink-0 items-center justify-center px-3 text-text-tertiary transition-colors hover:text-text-primary'
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff className='h-4 w-4' aria-hidden />
        ) : (
          <Eye className='h-4 w-4' aria-hidden />
        )}
      </button>
    </div>
  );
}
