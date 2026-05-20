'use client'

import React from 'react'
import { LogOut } from 'lucide-react'
import { useMe, useLogout } from '@/lib/hooks/useAuth'

export default function TopBar() {
  const { data: user } = useMe()
  const logoutMutation = useLogout()

  return (
    <header className="h-16 bg-white dark:bg-[#111315] border-b border-gray-200 dark:border-gray-800/60 flex items-center justify-between px-8 sticky top-0 z-40 shrink-0 transition-colors duration-200">
      <h2 className="text-xl font-bold text-farm-blue dark:text-blue-400">
        نظام إدارة مزارع الدواجن
      </h2>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {user?.name ?? '...'}
        </span>
        <button
          onClick={() => logoutMutation.mutate()}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </header>
  )
}
