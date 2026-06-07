'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import type { Toast, ToastVariant } from '../_lib/useToast'

const icons: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const styles: Record<ToastVariant, string> = {
  success: 'border-success/30 bg-success-soft text-success-strong',
  error: 'border-danger/30 bg-danger-soft text-danger-strong',
  warning: 'border-warning/30 bg-warning-soft text-warning-strong',
  info: 'border-info/30 bg-info-soft text-info-strong',
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [exiting, setExiting] = useState(false)
  const Icon = icons[toast.variant]

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const exitTimer = setTimeout(() => setExiting(true), toast.duration - 400)
      return () => clearTimeout(exitTimer)
    }
  }, [toast.duration])

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 ${styles[toast.variant]} ${
        exiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
      style={{ animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
      role="alert"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1 text-sm font-bold">{toast.message}</span>
      <button
        onClick={onClose}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-black/10 transition-colors"
        aria-label="إغلاق"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[]
  onRemove: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-2 max-w-sm" dir="rtl">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => onRemove(toast.id)} />
      ))}
    </div>
  )
}
