'use client'

import {
  ChronosAppleIcon,
  ChronosLinuxIcon,
  ChronosWindowsIcon
} from '@/components/marketing/chronos-icons'
import { ChronosIllustration } from '@/components/marketing/chronos-illustration'
import { ElevatedButtonLink } from '@/components/ui/elevated'
import { FadeIn } from '@/components/ui/fade-in'
import { getApiOrigin } from '@/lib/api-url'
import { Download, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PlatformDownload {
  name: string
  file: string
  url: string
  version: string
  arch: string
  size: string
}

interface DownloadsData {
  version: string
  platforms: {
    windows: PlatformDownload
    macos: PlatformDownload
    linux: PlatformDownload
  }
}

const ICONS = {
  windows: ChronosWindowsIcon,
  macos: ChronosAppleIcon,
  linux: ChronosLinuxIcon
} as const

const API_BASE = getApiOrigin()

export function DownloadClient () {
  const [data, setData] = useState<DownloadsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/v1/downloads`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const platforms = data
    ? (['windows', 'macos', 'linux'] as const).map(key => ({
        key,
        ...data.platforms[key],
        icon: ICONS[key]
      }))
    : []

  return (
    <>
      <section className='border-b border-border py-20 md:py-28'>
        <div className='container-main'>
          <div className='grid items-center gap-12 lg:grid-cols-2'>
            <FadeIn>
              <p className='label-caps label-caps-brand mb-4'>Download</p>
              <h1 className='heading-display text-text-primary'>
                Desktop agent
              </h1>
              <p className='prose-body mt-6 max-w-lg'>
                Sign in with your Chronos account, pick an assigned task, and
                start tracking. Screenshots are blurred on-device before upload.
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <ChronosIllustration name='agent' alt='Chronos desktop agent' />
            </FadeIn>
          </div>
        </div>
      </section>

      <section className='border-b border-border py-16 md:py-20'>
        <div className='container-main'>
          {loading ? (
            <div className='flex justify-center py-16'>
              <Loader2 className='h-6 w-6 animate-spin text-brand' />
            </div>
          ) : (
            <div className='grid gap-6 md:grid-cols-3'>
              {platforms.map((platform, i) => {
                const Icon = platform.icon
                return (
                  <FadeIn key={platform.key} delay={i * 0.05}>
                    <div className='flex h-full flex-col rounded-2xl border-2 border-[var(--elevated-ink)] bg-surface p-8 shadow-[0_5px_0_0_var(--elevated-ink)]'>
                      <div className='icon-box mb-6 h-14 w-14 text-brand'>
                        <Icon size={30} />
                      </div>
                      <h3 className='text-lg font-semibold text-text-primary'>
                        {platform.name}
                      </h3>
                      <p className='mt-1 text-sm font-medium text-text-secondary'>
                        {platform.version} · {platform.arch}
                      </p>
                      <div className='mt-4 flex-1'>
                        <p className='font-mono text-sm text-text-secondary'>
                          {platform.file}
                        </p>
                        <p className='mt-1 text-sm font-semibold text-text-primary'>
                          {platform.size}
                        </p>
                      </div>
                      <a
                        href={platform.url}
                        download
                        className='mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--elevated-ink)] bg-surface-elevated text-sm font-semibold text-text-primary shadow-[0_3px_0_0_var(--elevated-ink)] transition-all hover:translate-y-px hover:shadow-[0_2px_0_0_var(--elevated-ink)]'
                      >
                        <Download className='h-4 w-4' />
                        Download
                      </a>
                    </div>
                  </FadeIn>
                )
              })}
            </div>
          )}
          <p className='mt-8 text-center text-sm font-medium text-text-secondary'>
            v{data?.version ?? '0.1.0'} · macOS may prompt for Screen Recording
            permission for screenshots.
          </p>
        </div>
      </section>

      <section className='py-20 md:py-28'>
        <div className='container-main'>
          <FadeIn>
            <p className='label-caps label-caps-brand mb-10'>Getting started</p>
          </FadeIn>
          <div className='grid gap-10 md:grid-cols-3'>
            {[
              {
                step: '01',
                title: 'Create a workspace',
                body: 'Sign up and invite teammates they receive an email invite link.'
              },
              {
                step: '02',
                title: 'Install the agent',
                body: 'Download for Windows, macOS, or Linux. Sign in with email and password.'
              },
              {
                step: '03',
                title: 'Track assigned tasks',
                body: 'Pick your task in the agent. Time and screenshots sync automatically.'
              }
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.05}>
                <p className='font-mono text-sm font-semibold text-brand'>
                  {item.step}
                </p>
                <h3 className='heading-subsection mt-3 text-text-primary'>
                  {item.title}
                </h3>
                <p className='prose-muted mt-2'>{item.body}</p>
              </FadeIn>
            ))}
          </div>
          <div className='mt-16 text-center'>
            <ElevatedButtonLink href='/sign-up' size='lg' tone='primary'>
              Create your workspace
            </ElevatedButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
