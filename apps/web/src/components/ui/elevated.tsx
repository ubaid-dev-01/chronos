import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Elevated UI reference-inspired styling (thick border + offset shadow)
 * using Chronos brand tokens, not copied palette.
 */
type ElevatedTone = 'primary' | 'secondary' | 'ghost'

const tones: Record<ElevatedTone, string> = {
  primary:
    'bg-brand text-white hover:bg-brand/90 dark:bg-brand dark:text-white',
  secondary:
    'bg-surface text-text-primary hover:bg-surface-elevated dark:bg-surface dark:text-text-primary',
  ghost: 'bg-transparent text-text-primary hover:bg-surface-elevated'
}

const elevatedBase =
  'inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--elevated-ink)] font-semibold shadow-[0_4px_0_0_var(--elevated-ink)] transition-all duration-100 hover:translate-y-[2px] hover:shadow-[0_2px_0_0_var(--elevated-ink)] active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-50'

const sizes = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base'
}

interface ElevatedButtonLinkProps {
  href: string
  tone?: ElevatedTone
  size?: keyof typeof sizes
  className?: string
  children: React.ReactNode
}

export function ElevatedButtonLink ({
  href,
  tone = 'primary',
  size = 'md',
  className,
  children
}: ElevatedButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(elevatedBase, tones[tone], sizes[size], className)}
    >
      {children}
    </Link>
  )
}

export function ElevatedButton ({
  className,
  tone = 'primary',
  size = 'md',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ElevatedTone
  size?: keyof typeof sizes
}) {
  return (
    <button
      className={cn(elevatedBase, tones[tone], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}

/** Outlined CTA for pricing cards */
export function ElevatedOutlineLink ({
  href,
  className,
  children
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-11 w-full items-center justify-center rounded-xl border-2 border-[var(--elevated-ink)] bg-transparent text-sm font-semibold text-text-primary transition-colors hover:bg-surface-elevated',
        className
      )}
    >
      {children}
    </Link>
  )
}

/** Card shell rounded, soft shadow + optional top pill */
export function ElevatedCard ({
  className,
  children,
  variant = 'surface'
}: {
  className?: string
  children: React.ReactNode
  variant?: 'surface' | 'ink' | 'muted'
}) {
  const variants = {
    surface: 'bg-surface text-text-primary border-border',
    ink: 'bg-[#1a2b4b] text-white border-[#1a2b4b] dark:bg-[#1e293b] dark:border-[#334155]',
    muted: 'bg-surface-elevated text-text-primary border-border'
  }

  return (
    <div
      className={cn(
        'rounded-2xl border p-8 shadow-[0_8px_30px_rgb(0_0_0_/0.06)]',
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  )
}

export function ElevatedPill ({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full bg-[var(--elevated-ink)] px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-background',
        className
      )}
    >
      {children}
    </span>
  )
}
