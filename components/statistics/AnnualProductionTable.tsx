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
    <div className="bg-white rounded-3xl p-6 border-2 border-slate-400 shadow-md">
      <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-slate-300">
        <div className="p-3 bg-green-50 text-farm-green rounded-2xl border-2 border-green-300">
          <Egg className="w-5 h-5" />
        </div>
        <div>
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
        <div className="overflow-hidden border-2 border-slate-400 rounded-2xl shadow-inner">
          <table className="w-full text-right border-collapse">
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
      )}
    </div>
  )
}
