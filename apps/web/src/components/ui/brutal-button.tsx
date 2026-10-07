import Link from 'next/link'
import { cn } from '@/lib/utils'

type BrutalTone = 'mint' | 'white' | 'sky' | 'yellow'

const tones: Record<BrutalTone, string> = {
  mint: 'bg-[#63e6be] text-[#0f172a] hover:bg-[#56dfc0]',
  white: 'bg-white text-[#0f172a] hover:bg-zinc-50 dark:bg-zinc-100',
  sky: 'bg-[#7dd3fc] text-[#0f172a] hover:bg-[#67c9fa]',
  yellow: 'bg-[#ffd43b] text-[#0f172a] hover:bg-[#fcc419]'
}

const base =
  'inline-flex items-center justify-center gap-2.5 rounded-xl border-2 border-[#0f172a] font-bold shadow-[0_4px_0_0_#0f172a] transition-all duration-100 hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#0f172a] active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:opacity-60 dark:border-[#0f172a] dark:shadow-[0_4px_0_0_#0f172a]'

const sizes = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6 text-base',
  lg: 'h-14 px-8 text-lg'
}

interface BrutalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: BrutalTone
  size?: keyof typeof sizes
}

export function BrutalButton ({
  className,
  tone = 'sky',
  size = 'md',
  children,
  ...props
}: BrutalButtonProps) {
  return (
    <button
      className={cn(base, tones[tone], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}

interface BrutalButtonLinkProps {
  href: string
  tone?: BrutalTone
  size?: keyof typeof sizes
  className?: string
  children: React.ReactNode
}

export function BrutalButtonLink ({
  href,
  tone = 'sky',
  size = 'md',
  className,
  children
}: BrutalButtonLinkProps) {
  return (
    <Link href={href} className={cn(base, tones[tone], sizes[size], className)}>
      {children}
    </Link>
  )
}

/** Ghost brutal outlined, for pricing cards */
export function BrutalButtonLinkGhost ({
  href,
  borderColor,
  className,
  children
}: {
  href: string
  borderColor: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-12 w-full items-center justify-center rounded-xl border-2 bg-transparent text-base font-bold text-[#0f172a] transition-colors hover:bg-black/5',
        className
      )}
      style={{ borderColor }}
    >
      {children}
    </Link>
  )
}
