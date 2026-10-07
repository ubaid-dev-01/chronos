'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { COMPANY_LINKS } from '@/lib/nav-links'

export function NavCompanyMenu () {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick (e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className='relative'>
      <button
        type='button'
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup='true'
        className='flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary'
      >
        Company
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className='absolute left-1/2 top-full z-50 mt-1.5 min-w-[9rem] -translate-x-1/2 rounded-xl border-2 border-[var(--elevated-ink)] bg-surface p-1 shadow-[0_4px_0_0_var(--elevated-ink)]'>
          {COMPANY_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className='block rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary'
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
