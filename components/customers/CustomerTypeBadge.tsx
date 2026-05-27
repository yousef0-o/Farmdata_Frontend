'use client'

import React from 'react'

interface CustomerTypeBadgeProps {
  type: 'individual' | 'company'
}

export default function CustomerTypeBadge({ type }: CustomerTypeBadgeProps) {
  const config = type === 'company'
    ? { label: 'شركة', color: 'bg-info-soft text-info border-info-soft' }
    : { label: 'فرد', color: 'bg-surface-muted text-action-secondary border-line' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${config.color}`}>
      {config.label}
    </span>
  )
}
