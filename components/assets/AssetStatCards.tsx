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
      <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm transition-colors hover:shadow-md">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-ink-soft">إجمالي الأصول</span>
            <span className="block text-2xl font-bold text-ink">
              {(stats?.total_assets_count ?? 0).toLocaleString('en-US')} <span className="text-xs font-normal text-ink-muted">أصل</span>
            </span>
          </div>
          <div className="p-3 bg-quick-blue-bg text-quick-blue-text rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card 2: قيمة الشراء */}
      <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm transition-colors hover:shadow-md">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-ink-soft">قيمة الشراء</span>
            <span className="block text-2xl font-bold text-ink">
              {purchaseVal.toLocaleString('en-US')} <SaudiRiyalIcon size={18} className="ml-1 inline-block align-middle text-success-strong" />
            </span>
          </div>
          <div className="p-3 bg-quick-blue-bg text-quick-blue-text rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card 3: القيمة الدفترية with trend vs purchase */}
      <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm transition-colors hover:shadow-md">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-ink-soft">القيمة الدفترية</span>
            <span className="block text-2xl font-bold text-ink">
              {bookVal.toLocaleString('en-US')} <SaudiRiyalIcon size={18} className="ml-1 inline-block align-middle text-success-strong" />
            </span>
            <span className="text-xs font-medium text-danger">{trendVsPurchase}% مقابل الشراء</span>
          </div>
          <div className="p-3 bg-quick-green-bg text-quick-green-text rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Card 4: إجمالي الإهلاك with depreciation_percentage */}
      <div className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-sm transition-colors hover:shadow-md">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-ink-soft">إجمالي الإهلاك</span>
            <span className="block text-2xl font-bold text-danger">
              {(stats?.total_depreciation ?? 0).toLocaleString('en-US')} <SaudiRiyalIcon size={18} className="ml-1 inline-block align-middle text-success-strong" />
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-danger">
              <TrendingDown className="w-3 h-3" />
              {(stats?.depreciation_percentage ?? 0).toLocaleString('en-US')}%
            </span>
          </div>
          <div className="rounded-xl bg-danger-soft p-3 text-danger">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  )
}
