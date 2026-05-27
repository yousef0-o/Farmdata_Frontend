'use client'

import React from 'react'

interface CustomerStatusBadgeProps {
  isSuspended: boolean
}

export default function CustomerStatusBadge({ isSuspended }: CustomerStatusBadgeProps) {
  const config = isSuspended
    ? { label: 'موقوف', color: 'bg-danger-soft text-danger border-danger-soft' }
    : { label: 'نشط', color: 'bg-success-soft text-success-strong border-success-soft' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${config.color}`}>
      {config.label}
    </span>
  )
}
