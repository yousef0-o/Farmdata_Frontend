'use client'

import React, { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

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
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-ink-soft outline-none transition-colors duration-200 hover:bg-surface-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-action-primary/30"
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
    </button>
  )
}
