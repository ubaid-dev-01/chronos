import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/providers/theme-provider'
import { ThemeInitScript } from '@/components/theme/theme-init-script'
import { AuthProvider } from '@/providers/auth-provider'
import { defaultMetadata } from '@/lib/seo'
import './globals.css'

export const metadata: Metadata = defaultMetadata

export default function RootLayout ({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='en'
      className={`${GeistSans.variable} ${GeistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInitScript />
      </head>
      <body
        className='min-h-full bg-background font-sans text-text-primary antialiased'
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position='bottom-right'
              toastOptions={{
                className:
                  '!bg-surface !text-text-primary !border !border-border !shadow-md'
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
