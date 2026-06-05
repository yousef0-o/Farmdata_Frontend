'use client'

import React from 'react'
import type { FlockDetail } from '@/lib/types'

interface BarnOccupancyWidgetProps {
  flocks?: FlockDetail[]
  isLoading?: boolean
  className?: string
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString('ar-EG', { maximumFractionDigits })
}

export function BarnOccupancyWidget({
  flocks = [],
  isLoading = false,
  className = '',
}: BarnOccupancyWidgetProps) {
  const barns = Array.from(
    flocks.reduce((map, flock) => {
      const barnId = flock.barn_id
      const existing = map.get(barnId)
      const barnName = flock.barn?.barn_name ?? flock.barn?.name ?? `عنبر #${barnId}`
      const capacity = flock.barn?.capacity ?? 0
      const currentBirds = (existing?.currentBirds ?? 0) + (flock.current_count ?? 0)
      map.set(barnId, { barnId, barnName, capacity, currentBirds })
      return map
    }, new Map<number, { barnId: number; barnName: string; capacity: number; currentBirds: number }>())
  ).map(([, barn]) => barn)

  if (isLoading) {
    return <section className={`h-72 animate-pulse rounded-2xl border border-line bg-surface ${className}`} dir="rtl" />
  }

  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 shadow-sm ${className}`} dir="rtl">
      <h2 className="text-base font-bold text-ink">إشغال الحظائر</h2>
      <p className="mt-1 text-sm text-ink-muted">إجمالي الطيور الحالية مقابل السعة المسجلة.</p>
      <div className="mt-5 space-y-4">
        {barns.length === 0 ? (
          <p className="rounded-xl bg-surface-muted p-4 text-sm text-ink-muted">لا توجد بيانات حظائر نشطة.</p>
        ) : (
          barns.slice(0, 6).map((barn) => {
            const occupancy = barn.capacity > 0 ? (barn.currentBirds / barn.capacity) * 100 : 0
            return (
              <div key={barn.barnId} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-bold text-ink">{barn.barnName}</span>
                  <span className="font-mono text-ink-muted">{formatNumber(occupancy, 1)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full ${occupancy >= 95 ? 'bg-danger' : occupancy >= 80 ? 'bg-warning' : 'bg-success'}`}
                    style={{ width: `${Math.min(100, occupancy)}%` }}
                  />
                </div>
                <p className="text-xs text-ink-muted">
                  {formatNumber(barn.currentBirds)} طائر من {barn.capacity ? formatNumber(barn.capacity) : 'سعة غير مسجلة'}
                </p>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
