'use client'

import React from 'react'
import { CalendarClock } from 'lucide-react'
import type { MorningSummaryWatchlistItem } from '../../types/morningSummary'

interface LifecycleEventsWidgetProps {
  watchlist?: MorningSummaryWatchlistItem[]
  isLoading?: boolean
  className?: string
}

function thresholdFor(flock: MorningSummaryWatchlistItem) {
  return flock.flock_type === 'production' ? 420 : 140
}

export function LifecycleEventsWidget({
  watchlist = [],
  isLoading = false,
  className = '',
}: LifecycleEventsWidgetProps) {
  const events = watchlist
    .filter((flock) => flock.age_days !== null && flock.age_days >= thresholdFor(flock) - 14)
    .sort((a, b) => (b.age_days ?? 0) - (a.age_days ?? 0))
    .slice(0, 6)

  if (isLoading) {
    return <section className={`h-72 animate-pulse rounded-2xl border border-line bg-surface ${className}`} dir="rtl" />
  }

  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 shadow-sm ${className}`} dir="rtl">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-soft text-warning">
          <CalendarClock className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-base font-bold text-ink">أحداث دورة الحياة</h2>
          <p className="text-sm text-ink-muted">أفواج تقترب من نهاية المرحلة أو تحتاج مراجعة.</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {events.length === 0 ? (
          <p className="rounded-xl bg-success-soft p-4 text-sm font-semibold text-success-strong">
            لا توجد أفواج قريبة من الإغلاق ضمن الفلاتر الحالية.
          </p>
        ) : (
          events.map((flock) => {
            const threshold = thresholdFor(flock)
            const remaining = threshold - (flock.age_days ?? threshold)
            return (
              <div key={flock.flock_id} className="rounded-xl bg-surface-muted p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-ink">{flock.flock_number ?? `#${flock.flock_id}`}</p>
                  <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-bold text-warning-strong">
                    {remaining <= 0 ? 'تجاوز الحد' : `${remaining.toLocaleString('ar-EG')} يوم`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {flock.barn_name ?? 'عنبر غير محدد'}، عمر {flock.age_days?.toLocaleString('ar-EG')} يوم
                </p>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
