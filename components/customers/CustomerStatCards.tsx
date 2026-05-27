'use client'

import React from 'react'
import { Users, UserCheck, CreditCard, Coins } from 'lucide-react'
import type { CustomerStats } from '@/lib/types'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'

interface CustomerStatCardsProps {
  stats: CustomerStats | undefined
}

export default function CustomerStatCards({ stats }: CustomerStatCardsProps) {
  const totalCustomers = stats?.total_customers ?? 0
  const activeCustomers = stats?.active_customers ?? 0
  const suspendedCustomers = stats?.suspended_customers ?? 0
  const totalCreditLimit = stats?.total_credit_limit ?? 0
  const totalBalance = stats?.total_balance ?? 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Card 1: إجمالي العملاء */}
      <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm transition-colors hover:shadow-md">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-ink-soft">إجمالي العملاء</span>
            <span className="block text-2xl font-bold text-ink">
              {totalCustomers.toLocaleString('en-US')} <span className="text-xs font-normal text-ink-muted">عميل</span>
            </span>
            <span className="text-xs font-medium text-danger">موقوف: {suspendedCustomers}</span>
          </div>
          <div className="p-3 bg-quick-blue-bg text-quick-blue-text rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card 2: العملاء النشطين */}
      <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm transition-colors hover:shadow-md">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-ink-soft">العملاء النشطين</span>
            <span className="block text-2xl font-bold text-ink">
              {activeCustomers.toLocaleString('en-US')} <span className="text-xs font-normal text-ink-muted">عميل</span>
            </span>
            <span className="text-xs font-medium text-success">
              {totalCustomers > 0 ? ((activeCustomers / totalCustomers) * 100).toFixed(1) : '0.0'}% من الإجمالي
            </span>
          </div>
          <div className="p-3 bg-quick-green-bg text-quick-green-text rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card 3: إجمالي الحدود الائتمانية */}
      <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm transition-colors hover:shadow-md">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-ink-soft">إجمالي الحد الائتماني</span>
            <span className="block text-2xl font-bold text-ink">
              {totalCreditLimit.toLocaleString('en-US')} <SaudiRiyalIcon size={18} className="ml-1 inline-block align-middle text-success-strong" />
            </span>
            <span className="text-xs font-medium text-ink-muted">المبالغ غير المحدودة غير مشمولة</span>
          </div>
          <div className="rounded-xl bg-warning-soft p-3 text-warning">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card 4: إجمالي الأرصدة القائمة */}
      <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm transition-colors hover:shadow-md">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-ink-soft">إجمالي أرصدة العملاء</span>
            <span className={`block text-2xl font-bold ${totalBalance >= 0 ? 'text-ink' : 'text-danger'}`}>
              {totalBalance.toLocaleString('en-US')} <SaudiRiyalIcon size={18} className="ml-1 inline-block align-middle text-success-strong" />
            </span>
            <span className="text-xs font-medium text-ink-muted">صافي مدين (+) / دائن (-)</span>
          </div>
          <div className="rounded-xl bg-surface-muted p-3 text-action-secondary">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  )
}
