'use client'

import type { FlockAnalyticsResponse } from '@/lib/types'

interface AnnualMovementPanelProps {
  analytics: FlockAnalyticsResponse
}

export function AnnualMovementPanel({ analytics }: AnnualMovementPanelProps) {
  return (
    <section className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm">
      <div className="border-b border-line pb-4">
        <p className="text-xs font-semibold uppercase text-ink-muted">Annual Movement</p>
        <h2 className="text-xl font-bold text-ink">حركة الإنتاج السنوية</h2>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:hidden">
        {analytics.annual_movement.map((row) => (
          <article key={row.year} className="rounded-2xl border border-line bg-surface-subtle p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold text-ink">{row.year}</h3>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.carton_difference >= 0 ? 'bg-success-soft text-success-strong' : 'bg-danger-soft text-danger-strong'}`}>
                فرق {row.carton_difference.toFixed(2)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-bold text-ink-muted">الكرتون</p>
                <p className="mt-1 font-mono font-bold text-ink">{row.cartons_produced.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-ink-muted">إجمالي البيض</p>
                <p className="mt-1 font-mono font-bold text-ink">{row.eggs_produced.toLocaleString('en-US')}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-ink-muted">معدل الإنتاج</p>
                <p className="mt-1 font-mono font-bold text-ink">{row.production_rate.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs font-bold text-ink-muted">العلف/طن</p>
                <p className="mt-1 font-mono font-bold text-ink">{row.annual_feed_ton.toFixed(3)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 hidden overflow-x-auto lg:block">
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
