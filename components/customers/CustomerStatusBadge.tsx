'use client'

import React from 'react'

interface CustomerStatusBadgeProps {
  isSuspended: boolean
}

export default function CustomerStatusBadge({ isSuspended }: CustomerStatusBadgeProps) {
  const config = isSuspended
    ? { label: 'موقوف', color: 'bg-red-100 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/30' }
    : { label: 'نشط', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${config.color}`}>
      {config.label}
    </span>
  )
}
