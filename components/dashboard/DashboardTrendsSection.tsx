'use client'

import React, { useMemo, useState } from 'react'
import { Activity, BarChart3, LineChart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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

function buildAreaPath(points: Array<{ x: number; y: number }>, height: number, padding: { bottom: number }) {
  if (points.length === 0) return ''
  const line = buildPolyline(points)
  const first = points[0]
  const last = points[points.length - 1]
  return `M ${first.x},${height - padding.bottom} L ${line} L ${last.x},${height - padding.bottom} Z`
}

function formatDateLabel(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('ar-EG', {
    day: 'numeric',
    month: 'short',
  })
}

function buildTickIndexes(length: number) {
  if (length <= 1) return [0]
  const indexes = new Set<number>([0, length - 1])
  indexes.add(Math.floor((length - 1) / 3))
  indexes.add(Math.floor(((length - 1) * 2) / 3))
  return Array.from(indexes).sort((a, b) => a - b)
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
      <section className={`grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.9fr] ${className}`} dir="rtl">
        <div className="h-96 animate-pulse rounded-2xl border border-line bg-surface" />
        <div className="h-96 animate-pulse rounded-2xl border border-line bg-surface" />
      </section>
    )
  }

  const eggsValues = points.map((point) => point.total_eggs)
  const maxEggs = Math.max(...eggsValues, 1)
  const minEggs = Math.min(...eggsValues, 0)
  const eggsRange = Math.max(maxEggs - minEggs, 1)
  const averageEggs = eggsValues.length > 0
    ? eggsValues.reduce((sum, value) => sum + value, 0) / eggsValues.length
    : 0
  const lastPoint = points[points.length - 1]
  const width = 760
  const height = 300
  const padding = { top: 26, right: 18, bottom: 42, left: 76 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const step = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth
  const linePoints = points.map((point, index) => ({
    x: padding.left + index * step,
    y: padding.top + ((maxEggs - point.total_eggs) / eggsRange) * plotHeight,
  }))
  const xTickIndexes = buildTickIndexes(points.length)
  const yTicks = [0, 0.5, 1].map((ratio) => {
    const value = maxEggs - eggsRange * ratio
    return {
      value,
      y: padding.top + plotHeight * ratio,
    }
  })
  const maxMortality = Math.max(...mortalityByBarn.map((row) => row.mortality), 1)

  return (
    <section className={`grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.9fr] ${className}`} dir="rtl">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-line pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-soft text-info">
              <LineChart className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-ink">اتجاه الإنتاج</h2>
              <p className="text-xs text-ink-muted">إجمالي البيض اليومي داخل النطاق المختار.</p>
            </div>
          </div>
          <div className="inline-flex self-start rounded-xl border border-line bg-surface-muted p-1 lg:self-auto">
            {[7, 30].map((value) => (
              <Button
                key={value}
                type="button"
                onClick={() => setRange(value as 7 | 30)}
                variant={range === value ? 'outline' : 'ghost'}
                size="sm"
              >
                {value} أيام
              </Button>
            ))}
          </div>
        </div>

        {points.length > 0 ? (
          <>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-surface-muted px-4 py-3">
                <p className="text-xs font-semibold text-ink-muted">آخر قراءة</p>
                <p className="mt-1 font-mono text-lg font-bold text-ink">{formatNumber(lastPoint.total_eggs)}</p>
              </div>
              <div className="rounded-xl bg-surface-muted px-4 py-3">
                <p className="text-xs font-semibold text-ink-muted">المتوسط</p>
                <p className="mt-1 font-mono text-lg font-bold text-ink">{formatNumber(averageEggs)}</p>
              </div>
              <div className="rounded-xl bg-surface-muted px-4 py-3">
                <p className="text-xs font-semibold text-ink-muted">أعلى يوم</p>
                <p className="mt-1 font-mono text-lg font-bold text-ink">{formatNumber(maxEggs)}</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-line bg-surface-subtle p-3">
              <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full" role="img" aria-label="اتجاه إنتاج البيض">
                <defs>
                  <linearGradient id="dashboardProductionArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgb(194 65 12)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="rgb(194 65 12)" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {yTicks.map((tick) => (
                  <g key={tick.y}>
                    <line
                      x1={padding.left}
                      y1={tick.y}
                      x2={width - padding.right}
                      y2={tick.y}
                      stroke="rgb(229 226 218)"
                    />
                    <text
                      x={padding.left - 12}
                      y={tick.y + 4}
                      textAnchor="end"
                      className="fill-current text-xs font-medium text-ink-muted"
                    >
                      {formatNumber(tick.value)}
                    </text>
                  </g>
                ))}

                <path
                  d={buildAreaPath(linePoints, height, padding)}
                  fill="url(#dashboardProductionArea)"
                />
                <polyline
                  fill="none"
                  stroke="rgb(194 65 12)"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  points={buildPolyline(linePoints)}
                />
                {linePoints.map((point, index) => (
                  <circle
                    key={points[index].bucket}
                    cx={point.x}
                    cy={point.y}
                    r={range === 30 ? 2.5 : 4}
                    fill="rgb(194 65 12)"
                  />
                ))}

                {xTickIndexes.map((index) => (
                  <text
                    key={`${points[index].bucket}-label`}
                    x={linePoints[index].x}
                    y={height - 12}
                    textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
                    className="fill-current text-xs font-medium text-ink-muted"
                  >
                    {formatDateLabel(points[index].date)}
                  </text>
                ))}
              </svg>
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-xl bg-surface-muted p-6 text-center text-sm text-ink-muted">
            لا توجد نقاط إنتاج ضمن النطاق والتاريخ المحددين.
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
                <div key={row.barn} className="rounded-xl border border-line bg-surface-subtle p-3">
                  <div className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0 flex-1 leading-6 text-ink">{row.barn}</span>
                    <span className="rounded-lg bg-danger-soft px-2.5 py-1 font-mono text-xs font-bold text-danger-strong">
                      {formatNumber(row.mortality)}
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-muted">
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
