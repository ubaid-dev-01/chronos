import { cn } from '@/lib/utils'
import { ElevatedPill } from '@/components/ui/elevated'

interface ChronosFeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  variant: 'ink' | 'surface'
  tag?: string
  children?: React.ReactNode
  className?: string
}

export function ChronosFeatureCard ({
  icon,
  title,
  description,
  variant,
  tag,
  children,
  className
}: ChronosFeatureCardProps) {
  const isInk = variant === 'ink'

  return (
    <div
      className={cn(
        'relative rounded-2xl border-2 p-8 pt-10 shadow-[0_6px_0_0_var(--elevated-ink)]',
        isInk
          ? 'border-[#1a2b4b] bg-[#1a2b4b] text-white dark:border-[#334155] dark:bg-[#1e293b]'
          : 'border-[var(--elevated-ink)] bg-surface text-text-primary',
        className
      )}
    >
      {tag && (
        <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
          <ElevatedPill
            className={isInk ? 'bg-brand text-white' : 'bg-[var(--elevated-ink)]'}
          >
            {tag}
          </ElevatedPill>
        </div>
      )}

      <div
        className={cn(
          'mb-5 flex h-12 w-12 items-center justify-center rounded-xl border-2',
          isInk
            ? 'border-white/20 bg-white/10 text-brand-light'
            : 'border-[var(--elevated-ink)] bg-brand/10 text-brand'
        )}
      >
        {icon}
      </div>

      <h3 className='mb-2 text-lg font-semibold tracking-tight'>{title}</h3>
      <p
        className={cn(
          'text-sm leading-relaxed',
          isInk ? 'text-white/90' : 'text-text-secondary'
        )}
      >
        {description}
      </p>

      {children && <div className='mt-5'>{children}</div>}
    </div>
  )
}
