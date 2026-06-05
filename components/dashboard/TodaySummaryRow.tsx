'use client'

import React from 'react'
import { Bird, Egg, Scale, Skull } from 'lucide-react'
import { StatCard } from './StatCard'
import { StatCardSkeleton } from '../ui/Skeleton'
import type { MorningSummaryTotals } from '../../types/morningSummary'

interface TodaySummaryRowProps {
  summary?: MorningSummaryTotals | null
  isLoading?: boolean
  className?: string
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString('ar-EG', { maximumFractionDigits })
}

function mortalityRate(summary: MorningSummaryTotals) {
  if (summary.active_birds <= 0) return 0
  return (summary.mortality_today / summary.active_birds) * 100
}

export function TodaySummaryRow({
  summary,
  isLoading = false,
  className = '',
}: TodaySummaryRowProps) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }

  const activeBirds = summary?.active_birds ?? 0
  const deathsToday = summary?.mortality_today ?? 0
  const eggsToday = summary?.total_eggs_today ?? 0
  const cartonsToday = summary?.cartons_today ?? 0
  const feedToday = summary?.feed_kg_today ?? 0
  const productionFlocks = summary?.production_flock_count ?? 0
  const rate = summary ? mortalityRate(summary) : 0

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`} dir="rtl">
      <StatCard
        title="الطيور النشطة"
        value={formatNumber(activeBirds)}
        subtitle={`${formatNumber(summary?.active_flock_count ?? 0)} أفواج نشطة`}
        icon={<Bird className="h-6 w-6 text-success" />}
      />

      <StatCard
        title="النفوق اليوم"
        value={formatNumber(deathsToday)}
        subtitle={`${formatNumber(rate, 2)}% معدل النفوق`}
        icon={<Skull className="h-6 w-6 text-danger" />}
      />

      <StatCard
        title="بيض وكرتون اليوم"
        value={formatNumber(eggsToday)}
        subtitle={`${formatNumber(cartonsToday, 2)} كرتون، ${formatNumber(productionFlocks)} أفواج إنتاج`}
        icon={<Egg className="h-6 w-6 text-warning" />}
      />

      <StatCard
        title="العلف المستهلك اليوم"
        value={`${formatNumber(feedToday, 1)} كجم`}
        subtitle="إجمالي الاستهلاك اليومي"
        icon={<Scale className="h-6 w-6 text-info" />}
      />
    </div>
  )
}
