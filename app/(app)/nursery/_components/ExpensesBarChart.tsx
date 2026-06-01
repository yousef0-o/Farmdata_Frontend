'use client'

import React, { useMemo } from 'react'
import { CircleDollarSign } from 'lucide-react'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'
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
import type { NurseryPinnedExpenseAccount } from '@/lib/types/nurseryExpenses'

export default function ExpensesBarChart({ pinnedAccounts }: { pinnedAccounts: NurseryPinnedExpenseAccount[] }) {
  const chartData = useMemo(() => {
    const colors = ['#c2410c', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#64748b']
    return pinnedAccounts
      .map((item, index) => ({
        label: item.name || 'غير محدد',
        value: item.total_amount,
        valueDisplay: item.total_amount.toLocaleString('ar-SA'),
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value)
  }, [pinnedAccounts])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="rounded-xl border border-slate-100 bg-white/95 p-3 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">{item.label}</p>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400 text-right">
            المصروفات:{' '}
            <span className="font-mono font-extrabold text-[#c2410c] dark:text-orange-400 flex items-center justify-end gap-0.5 mt-0.5">
              {item.value.toLocaleString('ar-SA')}
              <SaudiRiyalIcon size={12} className="text-emerald-700 ml-0.5" />
            </span>
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
          المصروفات للبنود المثبتة
        </h3>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#c2410c] ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800">
          <CircleDollarSign className="h-4 w-4" />
        </span>
      </div>

      <div className="h-[224px] min-h-0 w-full relative rounded-2xl bg-white p-4 ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
            لا توجد حسابات مصروفات مثبتة لعرضها.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
                className="dark:stroke-slate-800"
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
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32} animationDuration={1000}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || '#c2410c'}
                    className="transition-all duration-300 hover:opacity-85"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
