'use client'

import React from 'react'
import { DollarSign, ArrowUpRight, ArrowDownLeft, Scale } from 'lucide-react'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'

interface LedgerSummaryCardProps {
  ledger: {
    total_debit: number
    total_credit: number
    net_balance: number
  }
}

export default function LedgerSummaryCard({ ledger }: LedgerSummaryCardProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(num)
  }

  const renderCurrency = (num: number, colorClass = 'text-emerald-400') => {
    return (
      <span className="inline-flex items-center gap-2 font-black text-2xl">
        <span>{formatNumber(num)}</span>
        <SaudiRiyalIcon size={24} className={colorClass} />
      </span>
    )
  }

  const isPositive = ledger.net_balance >= 0

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-8 shadow-xl border-2 border-slate-600">
      <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 text-white rounded-2xl backdrop-blur-md border-2 border-slate-650">
            <SaudiRiyalIcon size={22} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black">ملخص كشف الحساب التراكمي</h3>
            <p className="text-xs text-slate-350 font-bold">إجمالي الحركات والقيود المالية المسجلة محاسبياً للكيان</p>
          </div>
        </div>
        <Scale className="w-6 h-6 text-slate-500 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Debit */}
        <div className="bg-white/5 rounded-2xl p-5 border-2 border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-2 font-black">إجمالي المدين (Debit)</span>
            <span className="text-xl font-extrabold text-blue-400">
              {renderCurrency(ledger.total_debit, 'text-blue-400')}
            </span>
          </div>
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border-2 border-blue-500/20">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Credit */}
        <div className="bg-white/5 rounded-2xl p-5 border-2 border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block mb-2 font-black">إجمالي الدائن (Credit)</span>
            <span className="text-xl font-extrabold text-amber-400">
              {renderCurrency(ledger.total_credit, 'text-amber-400')}
            </span>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border-2 border-amber-500/20">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-white/10 rounded-2xl p-5 border-2 border-slate-500 flex items-center justify-between col-span-1 lg:col-span-1">
          <div>
            <span className="text-xs text-slate-300 block mb-2 font-black">صافي الرصيد الحالي</span>
            <span
              className={`text-2xl font-black ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {renderCurrency(ledger.net_balance, isPositive ? 'text-emerald-400' : 'text-rose-400')}
            </span>
          </div>
          <div
            className={`p-3 rounded-xl text-xs font-black border-2 ${
              isPositive
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
            }`}
          >
            {isPositive ? 'متوازن / مدين' : 'دائن'}
          </div>
        </div>
      </div>
    </div>
  )
}
