'use client'

import React from 'react'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:         { label: 'نشط',       color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30' },
  in_maintenance: { label: 'قيد الصيانة', color: 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30' },
  disposed:       { label: 'مُستبعد',    color: 'bg-red-100 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/30' },
  sold:           { label: 'مُباع',      color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700/30' },
}

interface AssetStatusBadgeProps {
  status: string
}

export default function AssetStatusBadge({ status }: AssetStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700/30',
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${config.color}`}>
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG }
