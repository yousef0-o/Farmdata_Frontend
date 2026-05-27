import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
}: StatCardProps) {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm transition-colors duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-3xl font-extrabold leading-tight text-ink">
            {value}
          </p>
          <p className="text-sm font-semibold text-ink-soft">{title}</p>
        </div>
        {icon && (
          <div className="rounded-xl bg-surface-muted p-3 text-ink-muted">
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend && trend !== 'neutral' && (
            <span
              className={`font-bold flex items-center ${
                trend === 'up' ? 'text-success' : 'text-danger'
              }`}
            >
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </span>
          )}
          {subtitle && <span className="text-ink-muted">{subtitle}</span>}
        </div>
      )}
    </div>
  )
}
