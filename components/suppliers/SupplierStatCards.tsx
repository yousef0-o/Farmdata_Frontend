'use client'

import React from 'react'
import { Truck, CheckCircle2, CreditCard, Coins } from 'lucide-react'
import type { SupplierStats } from '@/lib/types'

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
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 block">إجمالي الموردين</span>
            <span className="text-2xl font-bold text-gray-900 block">
              {totalSuppliers.toLocaleString('en-US')} <span className="text-xs font-normal text-gray-500">مورد</span>
            </span>
            <span className="text-xxs text-red-500 font-medium">موقوف: {suspendedSuppliers}</span>
          </div>
          <div className="p-3 bg-quick-blue-bg text-quick-blue-text rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card 2: الموردين النشطين */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 block">الموردين النشطين</span>
            <span className="text-2xl font-bold text-gray-900 block">
              {activeSuppliers.toLocaleString('en-US')} <span className="text-xs font-normal text-gray-500">مورد</span>
            </span>
            <span className="text-xxs text-emerald-500 font-medium">
              {totalSuppliers > 0 ? ((activeSuppliers / totalSuppliers) * 100).toFixed(1) : '0.0'}% من الإجمالي
            </span>
          </div>
          <div className="p-3 bg-quick-green-bg text-quick-green-text rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card 3: إجمالي الحدود الائتمانية */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 block">إجمالي الحد الائتماني</span>
            <span className="text-2xl font-bold text-gray-900 block">
              {totalCreditLimit.toLocaleString('en-US')} <span className="text-xs font-normal text-gray-500">ريال</span>
            </span>
            <span className="text-xxs text-gray-400 font-medium">المبالغ غير المحدودة غير مشمولة</span>
          </div>
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card 4: إجمالي الأرصدة القائمة */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 block">إجمالي أرصدة الموردين</span>
            <span className={`text-2xl font-bold block ${totalBalance >= 0 ? 'text-gray-900' : 'text-red-650'}`}>
              {totalBalance.toLocaleString('en-US')} <span className="text-xs font-normal text-gray-500">ريال</span>
            </span>
            <span className="text-xxs text-gray-400 font-medium">صافي مدين (+) / دائن (-)</span>
          </div>
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  )
}
