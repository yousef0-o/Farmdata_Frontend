'use client'

import React from 'react'
import { LogOut, Menu } from 'lucide-react'
import { useMe, useLogout } from '@/lib/hooks/useAuth'

type TopBarProps = {
  isDrawerOpen?: boolean
  onMenuToggle?: () => void
}

export default function TopBar({
  isDrawerOpen = false,
  onMenuToggle,
}: TopBarProps) {
  const { data: user } = useMe()
  const logoutMutation = useLogout()

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/85 transition-colors duration-200 sm:px-6 lg:px-8">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {onMenuToggle ? (
            <button
              type="button"
              onClick={onMenuToggle}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line bg-surface-muted text-action-primary transition-colors hover:bg-surface-subtle lg:hidden"
              aria-label={isDrawerOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={isDrawerOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}

          <h2 className="truncate text-base font-bold text-farm-blue dark:text-terracotta sm:text-lg lg:text-xl">
            نظام إدارة مزارع الدواجن
          </h2>
        </div>

        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <span className="hidden max-w-[12rem] truncate text-sm text-gray-600 dark:text-gray-400 sm:block">
            {user?.name ?? '...'}
          </span>
          <button
            onClick={() => logoutMutation.mutate()}
            className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-danger-soft hover:text-danger dark:text-gray-400 dark:hover:bg-red-950/20 dark:hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </header>
  )
}
