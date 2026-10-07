import { cn } from '@/lib/utils'

const stroke = 1.75

interface IconProps {
  className?: string
  size?: number
}

export function ChronosShieldIcon ({ className, size = 32 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 32 32'
      fill='none'
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <path
        d='M16 3L6 7.5V15c0 6.1 4.3 11.8 10 13 5.7-1.2 10-6.9 10-13V7.5L16 3z'
        stroke='currentColor'
        strokeWidth={stroke}
        strokeLinejoin='round'
      />
      <rect
        x='12.5'
        y='13'
        width='7'
        height='6'
        rx='1'
        stroke='currentColor'
        strokeWidth={stroke}
      />
      <path
        d='M16 13v-2.5a2 2 2 0 014 0V13'
        stroke='currentColor'
        strokeWidth={stroke}
        strokeLinecap='round'
      />
    </svg>
  )
}

export function ChronosPresenceIcon ({ className, size = 32 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 32 32'
      fill='none'
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <path
        d='M18 4L4 18h6l-2 10 16-16h-6l2-8z'
        stroke='currentColor'
        strokeWidth={stroke}
        strokeLinejoin='round'
        strokeLinecap='round'
      />
      <circle cx='24' cy='8' r='3' fill='#22c55e' stroke='white' strokeWidth='1.5' />
    </svg>
  )
}

export function ChronosChartIcon ({ className, size = 32 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 32 32'
      fill='none'
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <rect x='4' y='18' width='5' height='10' rx='1' fill='currentColor' opacity='0.25' />
      <rect x='11' y='12' width='5' height='16' rx='1' fill='currentColor' opacity='0.25' />
      <rect x='18' y='8' width='5' height='20' rx='1' fill='currentColor' />
      <rect x='25' y='14' width='3' height='14' rx='1' fill='currentColor' opacity='0.25' />
      <path d='M3 28h26' stroke='currentColor' strokeWidth={stroke} strokeLinecap='round' />
    </svg>
  )
}

export function ChronosCpuIcon ({ className, size = 32 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 32 32'
      fill='none'
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <rect
        x='9'
        y='9'
        width='14'
        height='14'
        rx='2'
        stroke='currentColor'
        strokeWidth={stroke}
      />
      <rect x='13' y='13' width='6' height='6' rx='1' fill='currentColor' opacity='0.3' />
      <path
        d='M12 5v4M16 5v4M20 5v4M12 23v4M16 23v4M20 23v4M5 12h4M5 16h4M23 12h4M23 16h4'
        stroke='currentColor'
        strokeWidth={stroke}
        strokeLinecap='round'
      />
    </svg>
  )
}

export function ChronosWindowsIcon ({ className, size = 28 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 28 28'
      fill='none'
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <rect x='3' y='4' width='10' height='10' fill='currentColor' opacity='0.85' />
      <rect x='15' y='4' width='10' height='10' fill='currentColor' opacity='0.65' />
      <rect x='3' y='16' width='10' height='10' fill='currentColor' opacity='0.65' />
      <rect x='15' y='16' width='10' height='10' fill='currentColor' opacity='0.85' />
    </svg>
  )
}

export function ChronosAppleIcon ({ className, size = 28 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 28 28'
      fill='none'
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <path
        d='M18.2 4.5c.1 1.1-.4 2.2-1 3-.7.9-1.8 1.6-2.9 1.5-.1-1 .4-2.1 1-2.9.7-.9 1.9-1.5 2.9-1.6zM19.5 7.8c-1.6-.1-3 .9-3.8.9s-2-.9-3.3-.8c-1.7.1-3.3 1-4.1 2.5-1.8 3.1-.5 7.7 1.2 10.2.8 1.2 1.8 2.5 3.1 2.4 1.2 0 1.7-.8 3.2-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4 1-1.4 1.4-2.8 1.4-2.9 0 0-2.8-1.1-2.8-4.2 0-2.7 2.2-3.9 2.3-4-1.3-1.9-3.3-2.1-4-2.1z'
        fill='currentColor'
      />
    </svg>
  )
}

export function ChronosLinuxIcon ({ className, size = 28 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 28 28'
      fill='none'
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <path
        d='M6 20l2-12h12l2 12H6z'
        stroke='currentColor'
        strokeWidth={stroke}
        strokeLinejoin='round'
      />
      <path d='M9 8l1-3h8l1 3' stroke='currentColor' strokeWidth={stroke} strokeLinecap='round' />
      <path
        d='M10 14h.01M18 14h.01'
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
      />
      <path d='M11 18c1 1.5 5 1.5 6 0' stroke='currentColor' strokeWidth={stroke} strokeLinecap='round' />
    </svg>
  )
}

export function ChronosClockIcon ({ className, size = 40 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 40 40'
      fill='none'
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <circle cx='20' cy='20' r='14' stroke='currentColor' strokeWidth={stroke} />
      <circle cx='20' cy='20' r='10' fill='currentColor' opacity='0.12' />
      <path
        d='M20 12v8l5 3'
        stroke='currentColor'
        strokeWidth={stroke}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <circle cx='20' cy='20' r='1.5' fill='currentColor' />
    </svg>
  )
}
