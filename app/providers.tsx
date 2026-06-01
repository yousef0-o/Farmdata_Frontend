'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { ThemeProvider } from 'next-themes'

// Intercept and suppress Recharts dimension mismatch warnings in development mode to clean up Turbopack terminal logs
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const suppressTrigger = 'width(-1) and height(-1)'

  const originalWarn = console.warn
  console.warn = (...args: any[]) => {
    if (args.some((arg) => typeof arg === 'string' && arg.includes(suppressTrigger))) {
      return
    }
    originalWarn(...args)
  }

  const originalError = console.error
  console.error = (...args: any[]) => {
    if (args.some((arg) => typeof arg === 'string' && arg.includes(suppressTrigger))) {
      return
    }
    originalError(...args)
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}

