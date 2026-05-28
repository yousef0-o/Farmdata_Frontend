'use client'

import type { FlockAnalyticsResponse } from '@/lib/types'

interface EggWeightDistributionMatrixProps {
  analytics: FlockAnalyticsResponse
}

export function EggWeightDistributionMatrix({ analytics }: EggWeightDistributionMatrixProps) {
  return (
    <section className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Egg Matrix</p>
          <h2 className="text-xl font-bold text-ink">مصفوفة توزيع الأوزان</h2>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-ink-soft">
          <span>الإجمالي: {analytics.egg_weight_distribution.summary.total_eggs.toLocaleString('en-US')} بيضة</span>
          <span>كراتين: {analytics.egg_weight_distribution.summary.total_cartons.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
          <span>أطباق: {analytics.egg_weight_distribution.summary.total_plates.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-right">
          <thead className="text-xs font-semibold text-ink-muted">
            <tr>
              <th className="px-3 py-3">الحجم</th>
              <th className="px-3 py-3">الكرتون</th>
              <th className="px-3 py-3">الأطباق</th>
              <th className="px-3 py-3">البيض</th>
              <th className="px-3 py-3">النسبة</th>
              <th className="px-3 py-3">متوسط الوزن</th>
              <th className="px-3 py-3">إجمالي الوزن/طن</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-sm">
            {analytics.egg_weight_distribution.rows.map((row) => (
              <tr key={row.size_code} className="hover:bg-surface-subtle">
                <td className="px-3 py-3 font-semibold text-ink">
                  <div>{row.label_ar}</div>
                  <div className="text-xs text-ink-muted">{row.label_en}</div>
                </td>
                <td className="px-3 py-3 font-mono text-ink">{row.cartons.toFixed(3)}</td>
                <td className="px-3 py-3 font-mono text-ink">{row.plates.toFixed(2)}</td>
                <td className="px-3 py-3 font-mono text-ink">{row.eggs.toLocaleString('en-US')}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-surface-muted">
                      <div
                        className="h-2 rounded-full bg-action-primary"
                        style={{ width: `${Math.min(row.percentage, 100)}%` }}
                      />
                    </div>
                    <span className="min-w-12 text-left font-mono text-ink">{row.percentage.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="px-3 py-3 font-mono text-ink">{row.egg_weight_gram.toFixed(2)} g</td>
                <td className="px-3 py-3 font-mono text-ink">{row.total_weight_ton.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
