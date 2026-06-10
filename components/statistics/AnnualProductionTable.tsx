'use client'

import React from 'react'
import { Egg, Calendar } from 'lucide-react'

interface AnnualProductionTableProps {
  data: {
    year: number
    month: number
    cartons: number
  }[]
}

const monthNames: Record<number, string> = {
  1: 'يناير',
  2: 'فبراير',
  3: 'مارس',
  4: 'أبريل',
  5: 'مايو',
  6: 'يونيو',
  7: 'يوليو',
  8: 'أغسطس',
  9: 'سبتمبر',
  10: 'أكتوبر',
  11: 'نوفمبر',
  12: 'ديسمبر',
}

export default function AnnualProductionTable({ data }: AnnualProductionTableProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="rounded-3xl border-2 border-slate-400 bg-white p-4 shadow-md sm:p-6">
      <div className="mb-6 flex min-w-0 items-center gap-3 border-b-2 border-slate-300 pb-3">
        <div className="shrink-0 rounded-2xl border-2 border-green-300 bg-green-50 p-3 text-farm-green">
          <Egg className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-black text-slate-900">حركة إنتاج البيض السنوية والشهرية</h3>
          <p className="text-xs text-slate-600 font-bold">توزيع الإنتاج الفعلي الكلي بالكرتون حسب الأشهر والأعوام</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
          <Calendar className="w-10 h-10 text-slate-400 mb-2" />
          <p className="text-sm text-slate-500 font-bold">لا يوجد سجلات إنتاج سابقة متوفرة</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {data.map((row, idx) => (
              <article key={`${row.year}-${row.month}-${idx}`} className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500">السنة المالية</p>
                    <h4 className="mt-1 text-base font-black text-slate-950">{row.year}</h4>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                    {monthNames[row.month] || row.month}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-bold text-slate-500">الإنتاج بالكرتون</p>
                    <p className="mt-1 font-black text-farm-green">{formatNumber(row.cartons)} كرتون</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">مكافئ الحجم</p>
                    <p className="mt-1 font-extrabold text-slate-700">{formatNumber(row.cartons * 12)} طبق</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border-2 border-slate-400 shadow-inner lg:block">
            <table className="w-full border-collapse text-right">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-xs font-black border-b-2 border-slate-400">
                <th className="px-6 py-4 border-l-2 border-slate-300">السنة المالية</th>
                <th className="px-6 py-4 border-l-2 border-slate-300">الشهر</th>
                <th className="px-6 py-4 border-l-2 border-slate-300">إجمالي الإنتاج بالكرتون</th>
                <th className="px-6 py-4">مكافئ الحجم (بالطبق)</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-300 text-slate-900 text-sm font-bold">
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-100/70 transition-colors odd:bg-white even:bg-slate-50/50"
                >
                  <td className="px-6 py-4 text-slate-950 font-black border-l-2 border-slate-300">{row.year}</td>
                  <td className="px-6 py-4 border-l-2 border-slate-300">{monthNames[row.month] || row.month}</td>
                  <td className="px-6 py-4 text-farm-green font-black border-l-2 border-slate-300">
                    {formatNumber(row.cartons)} كرتون
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-extrabold">
                    {formatNumber(row.cartons * 12)} طبق
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  )
}
