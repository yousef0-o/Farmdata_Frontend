'use client'

import React from 'react'

export function MovementTypeBadge({ type }: { type: 'in' | 'out' }) {
  return type === 'in' ? (
    <span className="inline-block rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success-strong">
      وارد
    </span>
  ) : (
    <span className="inline-block rounded-full bg-danger-soft px-2.5 py-1 text-xs font-bold text-danger">
      صادر
    </span>
  )
}
