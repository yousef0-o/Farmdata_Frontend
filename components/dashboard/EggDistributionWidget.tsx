'use client'

import React from 'react'
import { Info } from 'lucide-react'
import { EggWeightDistributionMatrix } from '../analytics/EggWeightDistributionMatrix'
import type { EggWeightDistribution } from '@/lib/types'

interface EggDistributionWidgetProps {
  distribution?: EggWeightDistribution
  isLoading?: boolean
  className?: string
}

export function EggDistributionWidget({
  distribution,
  isLoading = false,
  className = '',
}: EggDistributionWidgetProps) {
  if (isLoading) {
    return <section className={`h-72 animate-pulse rounded-2xl border border-line bg-surface ${className}`} dir="rtl" />
  }

  if (!distribution) {
    return (
      <section className={`rounded-2xl border border-line bg-surface p-5 shadow-sm ${className}`} dir="rtl">
        <div className="flex items-center gap-2 text-ink-muted">
          <Info className="h-5 w-5" />
          <span>اختر نطاقاً إحصائياً لعرض توزيع أوزان البيض.</span>
        </div>
      </section>
    )
  }

  return (
    <div className={className} dir="rtl">
      <EggWeightDistributionMatrix analytics={{ egg_weight_distribution: distribution }} />
    </div>
  )
}
