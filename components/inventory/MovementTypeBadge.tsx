'use client'

import React from 'react'

export function MovementTypeBadge({ type }: { type: 'in' | 'out' }) {
  return type === 'in' ? (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700 inline-block">
      وارد
    </span>
  ) : (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 inline-block">
      صادر
    </span>
  )
}
