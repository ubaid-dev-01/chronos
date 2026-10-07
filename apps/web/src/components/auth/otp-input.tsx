'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { authInputClassName } from './auth-card';

export function OtpInput ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, ' ').slice(0, 6).split('');

  function updateAt (index: number, char: string) {
    const next = value.split('');
    next[index] = char;
    onChange(next.join('').replace(/\s/g, '').slice(0, 6));
  }

  function handleChange (index: number, raw: string) {
    const char = raw.replace(/\D/g, '').slice(-1);
    if (!char) {
      updateAt(index, '');
      return;
    }
    updateAt(index, char);
    if (index < 5) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === 'Backspace' && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste (e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  }

  return (
    <div className='flex justify-center gap-2 sm:gap-3'>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type='text'
          inputMode='numeric'
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit.trim()}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={cn(
            authInputClassName,
            'h-12 w-11 px-0 text-center text-lg font-semibold tracking-widest sm:h-14 sm:w-12'
          )}
        />
      ))}
    </div>
  );
}
