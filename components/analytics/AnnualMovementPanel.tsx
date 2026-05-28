'use client'

import type { FlockAnalyticsResponse } from '@/lib/types'

interface AnnualMovementPanelProps {
  analytics: FlockAnalyticsResponse
}

export function AnnualMovementPanel({ analytics }: AnnualMovementPanelProps) {
  return (
    <section className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm">
      <div className="border-b border-line pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Annual Movement</p>
        <h2 className="text-xl font-bold text-ink">حركة الإنتاج السنوية</h2>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-right">
          <thead className="text-xs font-semibold text-ink-muted">
            <tr>
              <th className="px-3 py-3">السنة</th>
              <th className="px-3 py-3">الكرتون</th>
              <th className="px-3 py-3">إجمالي البيض</th>
              <th className="px-3 py-3">معدل الإنتاج</th>
              <th className="px-3 py-3">العلف/طن</th>
              <th className="px-3 py-3">فرق الكرتون</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-sm">
            {analytics.annual_movement.map((row) => (
              <tr key={row.year} className="hover:bg-surface-subtle">
                <td className="px-3 py-3 font-semibold text-ink">{row.year}</td>
                <td className="px-3 py-3 font-mono text-ink">{row.cartons_produced.toFixed(2)}</td>
                <td className="px-3 py-3 font-mono text-ink">{row.eggs_produced.toLocaleString('en-US')}</td>
                <td className="px-3 py-3 font-mono text-ink">{row.production_rate.toFixed(2)}%</td>
                <td className="px-3 py-3 font-mono text-ink">{row.annual_feed_ton.toFixed(3)}</td>
                <td className={`px-3 py-3 font-mono ${row.carton_difference >= 0 ? 'text-success-strong' : 'text-danger'}`}>
                  {row.carton_difference.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
