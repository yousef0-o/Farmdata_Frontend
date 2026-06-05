'use client'

import React from 'react'

interface BarnOccupancyWidgetProps {
  className?: string
}

export function BarnOccupancyWidget({
  className = '',
}: BarnOccupancyWidgetProps) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 shadow-sm ${className}`} dir="rtl">
      <h2 className="text-base font-bold text-ink">إشغال الحظائر</h2>
      <p className="mt-1 text-sm text-ink-muted">إجمالي الطيور الحالية مقابل السعة المسجلة.</p>
      <div className="mt-5 space-y-4">
        {/* TODO: Wire this widget to a non-paginated aggregate endpoint such as /barns/statistics when available. */}
        <p className="rounded-xl bg-surface-muted p-4 text-sm text-ink-muted">
          بيانات إشغال الحظائر غير متاحة حالياً. لم يتم عرض أرقام تقديرية لأن النظام لا يوفر endpoint إجمالي غير مرقم لهذه المؤشرات.
        </p>
      </div>
    </section>
  )
}
