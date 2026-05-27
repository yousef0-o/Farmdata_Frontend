'use client'

import React from 'react'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:         { label: 'نشط', color: 'bg-success-soft text-success-strong border-success-soft' },
  in_maintenance: { label: 'قيد الصيانة', color: 'bg-warning-soft text-warning-strong border-warning-soft' },
  disposed:       { label: 'مُستبعد', color: 'bg-danger-soft text-danger border-danger-soft' },
  sold:           { label: 'مُباع', color: 'bg-surface-muted text-ink-soft border-line' },
}

interface AssetStatusBadgeProps {
  status: string
}

export default function AssetStatusBadge({ status }: AssetStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: 'bg-surface-muted text-ink-soft border-line',
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG }
