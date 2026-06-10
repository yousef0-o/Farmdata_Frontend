'use client'

import React from 'react'
import { PackageCheck, TriangleAlert } from 'lucide-react'
import type { MorningSummaryFeedRunwayItem } from '../../types/morningSummary'

interface FeedRunwayWidgetProps {
  items?: MorningSummaryFeedRunwayItem[]
  isLoading?: boolean
  className?: string
}

function formatNumber(value: number, maximumFractionDigits = 1) {
  return value.toLocaleString('ar-EG', { maximumFractionDigits })
}

function runwayTone(days: number | null) {
  if (days === null) return { bar: 'bg-info', badge: 'bg-info-soft text-info-strong', label: 'غير محسوب' }
  if (days < 7) return { bar: 'bg-danger', badge: 'bg-danger-soft text-danger-strong', label: 'حرج' }
  if (days <= 14) return { bar: 'bg-warning', badge: 'bg-warning-soft text-warning-strong', label: 'قريب النفاد' }
  return { bar: 'bg-success', badge: 'bg-success-soft text-success-strong', label: 'مستقر' }
}

export function FeedRunwayWidget({
  items = [],
  isLoading = false,
  className = '',
}: FeedRunwayWidgetProps) {
  if (isLoading) {
    return (
      <section className={`h-72 animate-pulse rounded-2xl border border-line bg-surface ${className}`} dir="rtl" />
    )
  }

  return (
    <section className={`rounded-2xl border border-line bg-surface shadow-sm ${className}`} dir="rtl">
      <div className="flex items-center justify-between gap-3 border-b border-line p-5">
        <div>
          <h2 className="text-lg font-bold text-ink">مدى كفاية الأعلاف</h2>
          <p className="text-sm text-ink-muted">مخزون العلف مقابل متوسط استهلاك آخر 7 أيام.</p>
        </div>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-ink-muted">
          {items.length.toLocaleString('ar-EG')} أصناف
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 p-8 text-sm font-semibold text-ink-muted">
          <PackageCheck className="h-5 w-5" />
          لا توجد بيانات استهلاك كافية لحساب مدى كفاية الأعلاف.
        </div>
      ) : (
        <div className="divide-y divide-line">
          {items.map((item) => {
            const tone = runwayTone(item.days_remaining)
            const progress = item.days_remaining === null ? 0 : Math.min(100, (item.days_remaining / 21) * 100)
            return (
              <div key={`${item.warehouse_id}-${item.item_id}`} className="p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-ink">{item.item_name ?? 'صنف علف غير محدد'}</h3>
                      {item.low_stock && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger-strong">
                          <TriangleAlert className="h-3.5 w-3.5" />
                          مخزون منخفض
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{item.warehouse_name ?? 'مستودع غير محدد'}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3 lg:min-w-[420px] lg:gap-4">
                    <div>
                      <p className="text-xs text-ink-muted">المخزون</p>
                      <p className="font-mono font-bold text-ink">{formatNumber(item.stock_kg)} كجم</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">متوسط يومي</p>
                      <p className="font-mono font-bold text-ink">{formatNumber(item.daily_avg_consumption_kg)} كجم</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">الأيام المتبقية</p>
                      <p className="font-mono font-bold text-ink">
                        {item.days_remaining === null ? 'غير محسوب' : `${formatNumber(item.days_remaining, 1)} يوم`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${progress}%` }} />
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${tone.badge}`}>
                    {tone.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
