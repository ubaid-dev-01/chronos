import { cn } from '@/lib/utils'

type ChronosLogoMarkProps = {
  size?: 'sm' | 'nav' | 'md'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 rounded-lg shadow-[2px_2px_0_0_var(--elevated-ink)]',
  nav: 'h-10 w-10 rounded-lg shadow-[2px_2px_0_0_var(--elevated-ink)]',
  md: 'h-11 w-11 rounded-xl shadow-[3px_3px_0_0_var(--elevated-ink)]'
}

const iconSizes = {
  sm: 'h-[18px] w-[18px]',
  nav: 'h-5 w-5',
  md: 'h-6 w-6'
}

export function ChronosLogoMark ({
  size = 'sm',
  className
}: ChronosLogoMarkProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center border-2 border-[var(--elevated-ink)] bg-brand',
        sizeClasses[size],
        className
      )}
      aria-hidden
    >
      <svg
        viewBox='0 0 24 24'
        fill='none'
        className={iconSizes[size]}
        xmlns='http://www.w3.org/2000/svg'
      >
        <path
          d='M16.5 7.5C15.1 5.9 12.9 5 10.5 5.5C7.5 6.1 5.5 8.8 5.5 11.8C5.5 15.2 8.3 18 11.7 18C14.1 18 16.2 16.7 17.3 14.7'
          stroke='white'
          strokeWidth='2'
          strokeLinecap='round'
        />
        <path
          d='M12 8.5V12L14.5 13.5'
          stroke='white'
          strokeWidth='1.75'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    </span>
  )
}
