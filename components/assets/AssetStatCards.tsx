'use client'

import React from 'react'
import { Layers, DollarSign, Building2, TrendingDown } from 'lucide-react'
import type { AssetStats } from '@/lib/types'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'

interface AssetStatCardsProps {
  stats: AssetStats | undefined
}

export default function AssetStatCards({ stats }: AssetStatCardsProps) {
  const purchaseVal = stats?.total_purchase_value ?? 0
  const bookVal = stats?.total_book_value ?? 0
  const trendVsPurchase = purchaseVal > 0 ? ((bookVal - purchaseVal) / purchaseVal * 100).toFixed(1) : '0.0'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Card 1: إجمالي الأصول */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 block">إجمالي الأصول</span>
            <span className="text-2xl font-bold text-gray-900 block">
              {(stats?.total_assets_count ?? 0).toLocaleString('en-US')} <span className="text-xs font-normal text-gray-500">أصل</span>
            </span>
          </div>
          <div className="p-3 bg-quick-blue-bg text-quick-blue-text rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card 2: قيمة الشراء */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 block">قيمة الشراء</span>
            <span className="text-2xl font-bold text-gray-900 block">
              {purchaseVal.toLocaleString('en-US')} <SaudiRiyalIcon size={18} className="text-emerald-700 inline-block align-middle ml-1" />
            </span>
          </div>
          <div className="p-3 bg-quick-blue-bg text-quick-blue-text rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card 3: القيمة الدفترية with trend vs purchase */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 block">القيمة الدفترية</span>
            <span className="text-2xl font-bold text-gray-900 block">
              {bookVal.toLocaleString('en-US')} <SaudiRiyalIcon size={18} className="text-emerald-700 inline-block align-middle ml-1" />
            </span>
            <span className="text-xxs text-red-500 dark:text-red-400 font-medium">{trendVsPurchase}% مقابل الشراء</span>
          </div>
          <div className="p-3 bg-quick-green-bg text-quick-green-text rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card 4: إجمالي الإهلاك with depreciation_percentage */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-500 block">إجمالي الإهلاك</span>
            <span className="text-2xl font-bold text-red-650 dark:text-red-400 block">
              {(stats?.total_depreciation ?? 0).toLocaleString('en-US')} <SaudiRiyalIcon size={18} className="text-emerald-700 inline-block align-middle ml-1" />
            </span>
            <span className="text-xxs text-red-500 dark:text-red-400 font-medium flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              {(stats?.depreciation_percentage ?? 0).toLocaleString('en-US')}%
            </span>
          </div>
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  )
}
