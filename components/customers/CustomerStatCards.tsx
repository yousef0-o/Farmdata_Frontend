'use client'

import React from 'react'
import { Users, UserCheck, CreditCard, Coins } from 'lucide-react'
import type { CustomerStats } from '@/lib/types'

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
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 block">إجمالي العملاء</span>
            <span className="text-2xl font-bold text-gray-900 block">
              {totalCustomers.toLocaleString('en-US')} <span className="text-xs font-normal text-gray-500">عميل</span>
            </span>
            <span className="text-xxs text-red-500 font-medium">موقوف: {suspendedCustomers}</span>
          </div>
          <div className="p-3 bg-quick-blue-bg text-quick-blue-text rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card 2: العملاء النشطين */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 block">العملاء النشطين</span>
            <span className="text-2xl font-bold text-gray-900 block">
              {activeCustomers.toLocaleString('en-US')} <span className="text-xs font-normal text-gray-500">عميل</span>
            </span>
            <span className="text-xxs text-emerald-500 font-medium">
              {totalCustomers > 0 ? ((activeCustomers / totalCustomers) * 100).toFixed(1) : '0.0'}% من الإجمالي
            </span>
          </div>
          <div className="p-3 bg-quick-green-bg text-quick-green-text rounded-xl">
            <UserCheck className="w-5 h-5" />
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
            <span className="text-xs font-semibold text-gray-500 block">إجمالي أرصدة العملاء</span>
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
