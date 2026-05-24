'use client'

import React from 'react'

export function MovementTypeBadge({ type }: { type: 'in' | 'out' }) {
  return type === 'in' ? (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 inline-block">
      وارد
    </span>
  ) : (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 inline-block">
      صادر
    </span>
  )
}
