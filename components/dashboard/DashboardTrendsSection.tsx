'use client'

import React, { useMemo, useState } from 'react'
import { Activity, BarChart3, LineChart } from 'lucide-react'
import type { FlockAnalyticsResponse } from '@/lib/types'
import type { MorningSummaryWatchlistItem } from '../../types/morningSummary'

interface DashboardTrendsSectionProps {
  analytics?: FlockAnalyticsResponse
  watchlist?: MorningSummaryWatchlistItem[]
  isLoading?: boolean
  className?: string
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString('ar-EG', { maximumFractionDigits })
}

function buildPolyline(points: Array<{ x: number; y: number }>) {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

export function DashboardTrendsSection({
  analytics,
  watchlist = [],
  isLoading = false,
  className = '',
}: DashboardTrendsSectionProps) {
  const [range, setRange] = useState<7 | 30>(7)
  const sourcePoints = analytics?.series.points ?? []
  const points = sourcePoints.slice(-range)

  const mortalityByBarn = useMemo(() => {
    const rows = new Map<string, number>()
    watchlist.forEach((flock) => {
      const barn = flock.barn_name ?? 'غير محدد'
      rows.set(barn, (rows.get(barn) ?? 0) + flock.mortality_today)
    })
    return Array.from(rows.entries())
      .map(([barn, mortality]) => ({ barn, mortality }))
      .sort((a, b) => b.mortality - a.mortality)
      .slice(0, 8)
  }, [watchlist])

  if (isLoading) {
    return (
      <section className={`grid grid-cols-1 gap-4 xl:grid-cols-2 ${className}`} dir="rtl">
        <div className="h-80 animate-pulse rounded-2xl border border-line bg-surface" />
        <div className="h-80 animate-pulse rounded-2xl border border-line bg-surface" />
      </section>
    )
  }

  const maxEggs = Math.max(...points.map((point) => point.total_eggs), 1)
  const width = 680
  const height = 220
  const step = points.length > 1 ? width / (points.length - 1) : width
  const linePoints = points.map((point, index) => ({
    x: index * step,
    y: height - (point.total_eggs / maxEggs) * (height - 28) - 14,
  }))
  const maxMortality = Math.max(...mortalityByBarn.map((row) => row.mortality), 1)

  return (
    <section className={`grid grid-cols-1 gap-4 xl:grid-cols-2 ${className}`} dir="rtl">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-soft text-info">
              <LineChart className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-ink">اتجاه الإنتاج</h2>
              <p className="text-xs text-ink-muted">إجمالي البيض حسب آخر نقاط متاحة من الإحصائيات.</p>
            </div>
          </div>
          <div className="inline-flex rounded-xl border border-line bg-surface-muted p-1">
            {[7, 30].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value as 7 | 30)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  range === value
                    ? 'bg-surface text-action-primary shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {value} أيام
              </button>
            ))}
          </div>
        </div>

        {points.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height + 34}`} className="min-w-[620px]">
              <g transform="translate(0 6)">
                {[0, 1, 2, 3].map((index) => {
                  const y = 14 + (height - 28) * (index / 3)
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
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  points={buildPolyline(linePoints)}
                />
                {linePoints.map((point, index) => (
                  <circle key={points[index].bucket} cx={point.x} cy={point.y} r="4" fill="rgb(194 65 12)" />
                ))}
              </g>
              {points.map((point, index) => (
                <text
                  key={`${point.bucket}-label`}
                  x={index * step}
                  y={height + 28}
                  textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
                  className="fill-current text-[11px] font-medium text-ink-muted"
                >
                  {point.label}
                </text>
              ))}
            </svg>
          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-surface-muted p-6 text-center text-sm text-ink-muted">
            اختر نطاق شركة أو مشروع أو قسم أو عنبر لعرض ترند الإنتاج من `/api/statistics`.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink">النفوق حسب العنبر</h2>
            <p className="text-xs text-ink-muted">تجميع نفوق اليوم من قائمة المتابعة الحالية.</p>
          </div>
        </div>

        {mortalityByBarn.length > 0 ? (
          <div className="mt-5 space-y-3">
            {mortalityByBarn.map((row) => {
              const widthPercent = Math.max(4, (row.mortality / maxMortality) * 100)
              return (
                <div key={row.barn} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-semibold text-ink">{row.barn}</span>
                    <span className="font-mono text-ink-muted">{formatNumber(row.mortality)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-danger transition-all duration-200"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-success-soft p-6 text-sm font-semibold text-success-strong">
            <Activity className="h-4 w-4" />
            لا يوجد نفوق مسجل اليوم.
          </div>
        )}
      </div>
    </section>
  )
}
