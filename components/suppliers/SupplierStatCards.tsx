'use client'

import React from 'react'
import { Truck, CheckCircle2, CreditCard, Coins } from 'lucide-react'
import type { SupplierStats } from '@/lib/types'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'

interface SupplierStatCardsProps {
  stats: SupplierStats | undefined
}

export default function SupplierStatCards({ stats }: SupplierStatCardsProps) {
  const totalSuppliers = stats?.total_suppliers ?? 0
  const activeSuppliers = stats?.active_suppliers ?? 0
  const suspendedSuppliers = stats?.suspended_suppliers ?? 0
  const totalCreditLimit = stats?.total_credit_limit ?? 0
  const totalBalance = stats?.total_balance ?? 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Card 1: إجمالي الموردين */}
      <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm transition-colors hover:shadow-md">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-ink-soft">إجمالي الموردين</span>
            <span className="block text-2xl font-bold text-ink">
              {totalSuppliers.toLocaleString('en-US')} <span className="text-xs font-normal text-ink-muted">مورد</span>
            </span>
            <span className="text-xs font-medium text-danger">موقوف: {suspendedSuppliers}</span>
          </div>
          <div className="p-3 bg-quick-blue-bg text-quick-blue-text rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card 2: الموردين النشطين */}
      <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm transition-colors hover:shadow-md">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-ink-soft">الموردين النشطين</span>
            <span className="block text-2xl font-bold text-ink">
              {activeSuppliers.toLocaleString('en-US')} <span className="text-xs font-normal text-ink-muted">مورد</span>
            </span>
            <span className="text-xs font-medium text-success">
              {totalSuppliers > 0 ? ((activeSuppliers / totalSuppliers) * 100).toFixed(1) : '0.0'}% من الإجمالي
            </span>
          </div>
          <div className="p-3 bg-quick-green-bg text-quick-green-text rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
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
            <span className="block text-xs font-semibold text-ink-soft">إجمالي أرصدة الموردين</span>
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
