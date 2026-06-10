'use client'

import React, { useMemo } from 'react'
import { ChartPie } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'

interface ChartDatum {
  label: string
  value: number
  valueDisplay: string
  color: string
}

export default function SpeciesDonutChart({ data }: { data: ChartDatum[] }) {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
      return (
        <div className="rounded-xl border border-slate-100 bg-white/95 p-3 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.label}</span>
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          </div>
          <p className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">
            العدد:{' '}
            <span className="font-mono font-extrabold text-slate-950 dark:text-slate-50">
              {item.value.toLocaleString('ar-SA')}
            </span>{' '}
            ({percent}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-[320px] rounded-2xl border border-slate-100 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-900/40 flex flex-col justify-between">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-extrabold text-slate-950 dark:text-slate-50">
          توزيع الأشجار حسب النوع
        </h3>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#10b981] ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800">
          <ChartPie className="h-4 w-4" />
        </span>
      </div>

      <div className="grid min-h-56 grid-cols-1 items-center gap-6 rounded-2xl bg-white p-5 ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="relative mx-auto h-[160px] min-h-0 w-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="font-mono text-2xl font-extrabold text-slate-950 dark:text-slate-50 leading-none">
              {total.toLocaleString('ar-SA')}
            </span>
            <span className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
              شجرة
            </span>
          </div>
        </div>

        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
          {data.map((item) => {
            const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
            return (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-900 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800/80"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-xs font-extrabold text-slate-700 dark:text-slate-200">
                    {item.label}
                  </span>
                </div>
                <div className="text-left font-mono text-xs font-extrabold text-slate-950 dark:text-slate-50 flex items-center gap-1.5">
                  <span>{item.valueDisplay}</span>
                  <span className="text-xs text-slate-400 font-semibold">({percent}%)</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
