'use client'

import React from 'react'
import { ChartColumn } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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

export default function PotSizeChart({ data }: { data: ChartDatum[] }) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="rounded-xl border border-slate-100 bg-white/95 p-3 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{item.label}</p>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400 text-right">
            العدد:{' '}
            <span className="font-mono font-extrabold text-terracotta dark:text-orange-400">
              {item.value.toLocaleString('ar-SA')}
            </span>{' '}
            شجرة
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
          توزيع الأشجار حسب حجم المركن
        </h3>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-terracotta ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800">
          <ChartColumn className="h-4 w-4" />
        </span>
      </div>

      <div className="h-[224px] min-h-0 w-full relative rounded-2xl bg-white p-4 ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--neutral-100)"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              orientation="right"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--neutral-100)', radius: 8 }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32} animationDuration={1000}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || '#c2410c'}
                  className="transition-all duration-300 hover:opacity-85"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
