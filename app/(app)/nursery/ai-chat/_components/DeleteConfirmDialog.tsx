'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'

export default function DeleteConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <AppDialog open={open} onClose={onCancel} panelClassName="max-w-sm bg-surface rounded-2xl overflow-hidden shadow-2xl ring-1 ring-line">
      <div className="p-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft">
          <AlertTriangle className="h-6 w-6 text-danger" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-ink">{title}</h3>
          <p className="text-xs text-ink-muted mt-1">{message}</p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onCancel}
            className="min-h-10 px-5 py-2 rounded-xl text-sm font-bold text-ink-soft hover:bg-surface-muted transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="min-h-10 px-5 py-2 rounded-xl text-sm font-bold text-white bg-danger hover:bg-danger-strong transition-all shadow-sm"
          >
            حذف
          </button>
        </div>
      </div>
    </AppDialog>
  )
}
