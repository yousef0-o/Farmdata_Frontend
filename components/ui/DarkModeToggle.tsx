'use client'

import React, { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

import { Button } from '@/components/ui/Button'

function subscribeToClientMount() {
  return () => undefined
}

export default function DarkModeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribeToClientMount,
    () => true,
    () => false,
  )

  if (!mounted) {
    return (
      <div className="h-11 w-full rounded-xl bg-surface-muted animate-pulse" />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-full justify-between px-4 py-2.5"
      aria-label={isDark ? 'تفعيل الوضع المضيء' : 'تفعيل الوضع المظلم'}
      type="button"
    >
      <div className="flex items-center gap-3">
        {isDark ? (
          <Sun className="h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
        ) : (
          <Moon className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden="true" />
        )}
        <span className="min-w-0 truncate text-sm font-medium">
          {isDark ? 'الوضع المضيء' : 'الوضع المظلم'}
        </span>
      </div>
      <span className="shrink-0 rounded bg-surface-subtle px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-ink-muted">
        {isDark ? 'داكن' : 'فاتح'}
      </span>
    </Button>
  )
}
