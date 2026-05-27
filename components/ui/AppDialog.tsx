'use client'

import React, { useEffect, useRef } from 'react'

type AppDialogProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  labelledBy?: string
  describedBy?: string
  panelClassName?: string
  overlayClassName?: string
  closeOnOverlay?: boolean
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return []

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute('hidden'))
}

export default function AppDialog({
  open,
  onClose,
  children,
  labelledBy,
  describedBy,
  panelClassName = '',
  overlayClassName = '',
  closeOnOverlay = true,
}: AppDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusable = getFocusableElements(panelRef.current)
    focusable[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements(panelRef.current)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

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
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <button
        type="button"
        aria-label="إغلاق النافذة"
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm ${overlayClassName}`}
        onClick={closeOnOverlay ? onClose : undefined}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={`relative z-10 w-full ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  )
}
