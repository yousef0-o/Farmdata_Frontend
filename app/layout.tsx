import type { Metadata } from 'next'
import { Reem_Kufi, IBM_Plex_Sans_Arabic, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const reemKufi = Reem_Kufi({
  variable: '--font-display',
  subsets: ['arabic'],
})

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: '--font-sans',
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'نظام إدارة مزارع الدواجن - فارم داتا',
  description: 'نظام متكامل لإدارة مزارع الدواجن',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${ibmPlexSansArabic.variable} ${reemKufi.variable} ${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full bg-gray-50 dark:bg-gray-950 text-gray-900"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
