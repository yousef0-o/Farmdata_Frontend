'use client'

import React from 'react'
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'

interface LedgerSummaryCardProps {
  ledger: {
    total_debit: number
    total_credit: number
    net_balance: number
  }
}

type LedgerMetric = {
  key: string
  label: string
  value: number
  tone: string
  surface: string
  icon: React.ElementType
  suffix?: string
}

export default function LedgerSummaryCard({ ledger }: LedgerSummaryCardProps) {
  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(num)

  const netPositive = ledger.net_balance >= 0

  const metrics: LedgerMetric[] = [
    {
      key: 'debit',
      label: 'إجمالي المدين',
      value: ledger.total_debit,
      tone: 'text-info',
      surface: 'bg-info-soft',
      icon: ArrowUpRight,
    },
    {
      key: 'credit',
      label: 'إجمالي الدائن',
      value: ledger.total_credit,
      tone: 'text-warning-strong',
      surface: 'bg-warning-soft',
      icon: ArrowDownLeft,
    },
    {
      key: 'net',
      label: 'صافي الرصيد الحالي',
      value: ledger.net_balance,
      tone: netPositive ? 'text-success-strong' : 'text-danger',
      surface: netPositive ? 'bg-success-soft' : 'bg-danger-soft',
      icon: Scale,
      suffix: netPositive ? 'متوازن / مدين' : 'دائن',
    },
  ] as const

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <header className="mb-4 flex items-start justify-between gap-4 border-b border-line pb-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-ink">ملخص كشف الحساب التراكمي</h3>
          <p className="text-xs text-ink-muted">
            إجمالي الحركات والقيود المالية المسجلة محاسبياً للكيان.
          </p>
        </div>
        <div className="rounded-xl bg-surface-muted p-2 text-ink-soft">
          <SaudiRiyalIcon size={18} className="text-ink-soft" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon

          return (
            <div
              key={metric.key}
              className="rounded-xl border border-line bg-surface-subtle px-4 py-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-ink-muted">{metric.label}</p>
                  <div className={`inline-flex items-center gap-2 text-xl font-bold ${metric.tone}`}>
                    <span>{formatNumber(metric.value)}</span>
                    <SaudiRiyalIcon size={18} className={metric.tone} />
                  </div>
                </div>
                <div className={`rounded-lg p-2 ${metric.surface} ${metric.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              {metric.suffix ? (
                <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${metric.surface} ${metric.tone}`}>
                  {metric.suffix}
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
