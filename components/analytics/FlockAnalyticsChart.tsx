'use client'

import type { FlockAnalyticsResponse } from '@/lib/types'

interface FlockAnalyticsChartProps {
  analytics: FlockAnalyticsResponse
}

function buildPolyline(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

export function FlockAnalyticsChart({ analytics }: FlockAnalyticsChartProps) {
  const points = analytics.series.points

  if (points.length === 0) {
    return (
      <section className="rounded-[1.75rem] border border-line bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-bold text-ink">محرك الرسم التحليلي</h2>
        <p className="mt-3 text-sm text-ink-soft">لا توجد نقاط كافية لعرض السلسلة المختارة.</p>
      </section>
    )
  }

  const maxLayRate = Math.max(...points.map((point) => point.lay_rate), 1)
  const maxFeed = Math.max(...points.map((point) => point.feed_kg), 1)
  const width = 780
  const height = 260
  const step = points.length > 1 ? width / (points.length - 1) : width

  const layRatePoints = points.map((point, index) => ({
    x: index * step,
    y: height - (point.lay_rate / maxLayRate) * (height - 24) - 12,
  }))

  const feedPoints = points.map((point, index) => ({
    x: index * step,
    y: height - (point.feed_kg / maxFeed) * (height - 24) - 12,
  }))

  return (
    <section className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-ink-muted">Chart Engine</p>
          <h2 className="text-xl font-bold text-ink">الرسم التفاعلي للإنتاج والعلف</h2>
          <p className="text-sm text-ink-soft">
            {analytics.meta.aggregation === 'daily' ? 'عرض يومي' : analytics.meta.aggregation === 'weekly' ? 'تجميع أسبوعي' : 'تجميع كل 28 يوم'}
            {' / '}
            {analytics.meta.axis === 'date' ? 'محور التاريخ' : 'محور العمر'}
          </p>
        </div>
        <div className="flex gap-3 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-action-primary" /> Lay Rate</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-action-secondary" /> Feed Kg</span>
        </div>
      </div>

      <div className="mt-5 max-w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height + 34}`} className="h-auto w-full">
          <g transform="translate(0 6)">
            {[0, 1, 2, 3].map((index) => {
              const y = 12 + (height - 24) * (index / 3)
              return (
                <line
                  key={index}
                  x1="0"
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="rgba(199,195,183,0.55)"
                  strokeDasharray="4 6"
                />
              )
            })}

            <polyline
              fill="none"
              stroke="rgb(194 65 12)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={buildPolyline(layRatePoints)}
            />
            <polyline
              fill="none"
              stroke="rgb(28 59 43)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={buildPolyline(feedPoints)}
            />

            {layRatePoints.map((point, index) => (
              <g key={points[index].bucket}>
                <circle cx={point.x} cy={point.y} r="4.5" fill="rgb(194 65 12)" />
                <circle cx={feedPoints[index].x} cy={feedPoints[index].y} r="4.5" fill="rgb(28 59 43)" />
              </g>
            ))}
          </g>

          {points.map((point, index) => (
            <text
              key={`${point.bucket}-label`}
              x={index * step}
              y={height + 26}
              textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
              className="fill-current text-xs font-medium text-ink-soft"
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>
    </section>
  )
}
