'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

export default function DarkModeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by waiting until mounted on the client
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-10 rounded-xl bg-gray-800/40 animate-pulse" />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 text-gray-400 hover:bg-gray-800/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-farm-blue"
      aria-label={isDark ? 'تفعيل الوضع المضيء' : 'تفعيل الوضع المظلم'}
      type="button"
    >
      <div className="flex items-center gap-3">
        {isDark ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-gray-400" />
        )}
        <span className="text-sm font-medium">
          {isDark ? 'الوضع المضيء' : 'الوضع المظلم'}
        </span>
      </div>
      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-800 text-gray-400">
        {isDark ? 'داكن' : 'فاتح'}
      </span>
    </button>
  )
}
