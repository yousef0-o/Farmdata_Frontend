'use client'

import { AlertTriangle, BarChart3, Egg, Scale, Target, TrendingUp } from 'lucide-react'
import type { ComponentType } from 'react'
import type { FlockAnalyticsResponse } from '@/lib/types'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'

interface FlockAnalyticsCardsProps {
  analytics: FlockAnalyticsResponse
}

const numberFormatter = new Intl.NumberFormat('ar-EG', {
  maximumFractionDigits: 2,
})

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—'
  return Number(value).toLocaleString('ar-EG', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—'
  return `${formatNumber(value, 2)}%`
}

function formatInteger(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—'
  return numberFormatter.format(Number(value))
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  accent,
  currency,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  detail: React.ReactNode
  accent: 'clay' | 'emerald' | 'danger' | 'slate'
  currency?: boolean
}) {
  const tone = {
    clay: 'bg-orange-50 text-[#c2410c] border-orange-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    danger: 'bg-red-50 text-red-700 border-red-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
  }[accent]

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-transform duration-150 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500">
          محسوب
        </span>
      </div>
      <p className="mt-4 text-xs font-bold text-slate-500">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="font-mono text-2xl font-bold text-slate-950">{value}</span>
        {currency ? <SaudiRiyalIcon size={18} className="text-emerald-700" /> : null}
      </div>
      <p className="mt-2 min-h-9 text-xs font-semibold leading-5 text-slate-600">{detail}</p>
    </article>
  )
}

export function FlockAnalyticsCards({ analytics }: FlockAnalyticsCardsProps) {
  const { breeding, production } = analytics.summary
  const targetCartons = production.targets.operational_target_cartons
  const targetPlates = production.targets.operational_target_eggs / 30
  const actualPlates = production.total_eggs / 30
  const cartonAchievement = production.targets.operational_achievement_rate
  const plateAchievement = targetPlates > 0 ? (actualPlates / targetPlates) * 100 : null

  return (
    <section dir="rtl" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        icon={AlertTriangle}
        label="معدل النافق التراكمي"
        value={formatPercent(Math.max(breeding.mortality_rate, production.mortality_rate))}
        detail={`تربية: ${formatInteger(breeding.mortality_breeding)} طير، إنتاج: ${formatInteger(production.mortality_production)} طير`}
        accent="danger"
      />
      <MetricCard
        icon={Scale}
        label="قيمة الطير الرأسمالية"
        value={formatNumber(breeding.bird_value || production.bird_value, 2)}
        detail={
          <span className="flex items-center gap-1 font-sans justify-start flex-wrap">
            <span>إجمالي قيمة الفوج: {formatNumber(breeding.total_flock_value, 2)}</span>
            <SaudiRiyalIcon size={12} className="text-emerald-700 ml-0.5" />
          </span>
        }
        accent="emerald"
        currency
      />
      <MetricCard
        icon={TrendingUp}
        label="قيمة النافق التراكمي"
        value={formatNumber((breeding.mortality_value || 0) + (production.mortality_value || 0), 2)}
        detail={
          <span className="flex items-center gap-1 font-sans justify-start flex-wrap">
            <span>تربية: {formatNumber(breeding.mortality_value, 2)}</span>
            <SaudiRiyalIcon size={12} className="text-emerald-700 ml-0.5" />
            <span className="mx-1">،</span>
            <span>إنتاج: {formatNumber(production.mortality_value, 2)}</span>
            <SaudiRiyalIcon size={12} className="text-emerald-700 ml-0.5" />
          </span>
        }
        accent="clay"
        currency
      />
      <MetricCard
        icon={Target}
        label="تحقيق المستهدف"
        value={formatPercent(cartonAchievement)}
        detail={`كراتين: ${formatNumber(production.cartons_produced, 2)} / ${formatNumber(targetCartons, 2)}، أطباق: ${formatNumber(actualPlates, 2)} / ${formatNumber(targetPlates, 2)} (${formatPercent(plateAchievement)})`}
        accent="slate"
      />
      <MetricCard
        icon={Egg}
        label="إجمالي البيض"
        value={formatInteger(production.total_eggs)}
        detail={`الوزن الكلي: ${formatNumber(production.total_egg_weight_ton, 3)} طن`}
        accent="emerald"
      />
      <MetricCard
        icon={BarChart3}
        label="العلف التراكمي"
        value={`${formatNumber((breeding.total_feed_kg + production.total_feed_kg) / 1000, 3)} طن`}
        detail={`إنتاج: ${formatNumber(production.total_feed_ton, 3)} طن، تربية: ${formatNumber(breeding.total_feed_kg / 1000, 3)} طن`}
        accent="clay"
      />
      <MetricCard
        icon={Target}
        label="تحقيق كراتين التشغيل"
        value={formatPercent(production.targets.operational_achievement_rate)}
        detail={`المستهدف التشغيلي ${formatNumber(production.targets.operational_target_cartons, 2)} كرتون`}
        accent="slate"
      />
      <MetricCard
        icon={Target}
        label="تحقيق الكراتين القياسي"
        value={formatPercent(production.targets.standard_achievement_rate)}
        detail={`المستهدف القياسي ${formatNumber(production.targets.standard_target_cartons, 2)} كرتون`}
        accent="slate"
      />
    </section>
  )
}
