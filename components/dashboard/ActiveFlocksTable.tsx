'use client'

import React from 'react'
import Link from 'next/link'
import type { FlockDetail } from '@/lib/types'
import { FlockTypeBadge } from '../flock/FlockTypeBadge'
import { FlockStatusBadge } from '../flock/FlockStatusBadge'

interface ActiveFlocksTableProps {
  flocks: FlockDetail[]
  loading: boolean
}

export function ActiveFlocksTable({ flocks, loading }: ActiveFlocksTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-12 bg-gray-50 border border-gray-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (flocks.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
        <p className="text-gray-400 text-sm font-medium">لا توجد أقطاع نشطة حالياً</p>
      </div>
    )
  }

  // Max 10 rows
  const displayedFlocks = flocks.slice(0, 10)

  const calculateDays = (entryDate: string) => {
    try {
      const diffTime = Date.now() - new Date(entryDate).getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      return diffDays < 0 ? 0 : diffDays
    } catch {
      return 0
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-border rounded-2xl bg-surface shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-200 bg-gray-50/75 dark:bg-gray-950/75 text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
              <th className="px-6 py-4">القطيع</th>
              <th className="px-6 py-4">العنبر</th>
              <th className="px-6 py-4">النوع</th>
              <th className="px-6 py-4">الطيور الحالية</th>
              <th className="px-6 py-4">أيام من الدخول</th>
              <th className="px-6 py-4">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40 text-sm text-gray-700">
            {displayedFlocks.map((flock) => {
              const days = calculateDays(flock.entry_date)
              return (
                <tr
                  key={flock.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-950/50 transition-colors duration-150 cursor-pointer"
                >
                  <td className="px-6 py-4 font-semibold text-farm-blue dark:text-terracotta">
                    <Link href={`/flocks/${flock.id}`} className="hover:underline block">
                      #{flock.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {flock.barn?.barn_name ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <FlockTypeBadge type={flock.flock_type} />
                  </td>
                  <td className="px-6 py-4 font-mono font-medium">
                    {flock.current_count.toLocaleString('en-US')}
                  </td>
                  <td className="px-6 py-4 font-mono font-medium">
                    {days.toLocaleString('en-US')} يوم
                  </td>
                  <td className="px-6 py-4">
                    <FlockStatusBadge status={flock.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {flocks.length > 10 && (
        <div className="text-left">
          <Link
            href="/flocks"
            className="text-xs font-bold text-farm-blue hover:text-farm-blue/80 transition-colors duration-200"
          >
            عرض الكل ({flocks.length}) ←
          </Link>
        </div>
      )}
    </div>
  )
}
