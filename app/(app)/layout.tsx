'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { useMe } from '@/lib/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isError } = useMe()
  const router = useRouter()

  useEffect(() => {
    if (isError) {
      router.push('/login')
    }
  }, [isError, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return []

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute('hidden'))
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const drawerTitleId = useId()

  useEffect(() => {
    if (!isDrawerOpen) return

    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusableElements = getFocusableElements(drawerRef.current)
    focusableElements[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false)
        return
      }

      if (event.key !== 'Tab') return

      const focusable = getFocusableElements(drawerRef.current)
      if (focusable.length === 0) return

      const firstElement = focusable[0]
      const lastElement = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [isDrawerOpen])

  return (
    <AuthGuard>
      <div className="h-screen w-full max-w-full overflow-hidden bg-background font-sans text-foreground transition-colors duration-200" dir="rtl">
        <div className="flex h-screen w-full min-w-0 max-w-full lg:flex-row">
          <Sidebar className="hidden lg:flex lg:w-64 xl:w-64 lg:h-screen lg:shrink-0" />

          <div className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
            <TopBar
              isDrawerOpen={isDrawerOpen}
              onMenuToggle={() => setIsDrawerOpen((open) => !open)}
            />
            <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
              <div className="min-w-0 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
                {children}
              </div>
            </main>
          </div>
        </div>

        {isDrawerOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden" aria-hidden={!isDrawerOpen}>
            <button
              type="button"
              className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
              aria-label="إغلاق القائمة"
              onClick={() => setIsDrawerOpen(false)}
            />

            <div
              ref={drawerRef}
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby={drawerTitleId}
              className="absolute inset-y-0 right-0 flex h-full w-[min(100vw,24rem)] max-w-full flex-col bg-surface shadow-2xl"
            >
              <Sidebar
                className="w-full"
                drawerTitleId={drawerTitleId}
                isMobileDrawer
                onNavigate={() => setIsDrawerOpen(false)}
                onClose={() => setIsDrawerOpen(false)}
              />
            </div>
          </div>
        ) : null}
      </div>
    </AuthGuard>
  )
}
