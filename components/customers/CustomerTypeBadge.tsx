'use client'

import React from 'react'

interface CustomerTypeBadgeProps {
  type: 'individual' | 'company'
}

export default function CustomerTypeBadge({ type }: CustomerTypeBadgeProps) {
  const config = type === 'company'
    ? { label: 'شركة', color: 'bg-blue-100 text-blue-700 border-blue-200' }
    : { label: 'فرد', color: 'bg-purple-100 text-purple-700 border-purple-200' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${config.color}`}>
      {config.label}
    </span>
  )
}
