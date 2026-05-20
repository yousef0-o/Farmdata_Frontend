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
    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-3xl font-extrabold text-gray-900 dark:text-[#ffffff] leading-tight">
            {value}
          </p>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-700">{title}</p>
        </div>
        {icon && (
          <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {trend && trend !== 'neutral' && (
            <span
              className={`font-bold flex items-center ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </span>
          )}
          {subtitle && <span className="text-gray-400 dark:text-gray-600">{subtitle}</span>}
        </div>
      )}
    </div>
  )
}
