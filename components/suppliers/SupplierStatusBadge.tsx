'use client'

import React from 'react'

interface SupplierStatusBadgeProps {
  isSuspended: boolean
}

export default function SupplierStatusBadge({ isSuspended }: SupplierStatusBadgeProps) {
  const config = isSuspended
    ? { label: 'موقوف', color: 'bg-red-100 text-red-700 border-red-200' }
    : { label: 'نشط', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${config.color}`}>
      {config.label}
    </span>
  )
}
