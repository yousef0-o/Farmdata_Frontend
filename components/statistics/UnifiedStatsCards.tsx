'use client'

import React, { useState } from 'react'
import { EntityStatistics } from '@/lib/types'
import {
  Activity,
  Briefcase,
  Egg,
  Percent,
  Scale,
  TrendingUp,
  Users,
} from 'lucide-react'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'

interface UnifiedStatsCardsProps {
  stats: EntityStatistics
}

type MetricTone = {
  badge: string
  icon: string
  value: string
}

const TONES: Record<'info' | 'success' | 'warning' | 'danger' | 'neutral', MetricTone> = {
  info: {
    badge: 'bg-info-soft text-info',
    icon: 'bg-info-soft text-info',
    value: 'text-info',
  },
  success: {
    badge: 'bg-success-soft text-success-strong',
    icon: 'bg-success-soft text-success-strong',
    value: 'text-success-strong',
  },
  warning: {
    badge: 'bg-warning-soft text-warning-strong',
    icon: 'bg-warning-soft text-warning-strong',
    value: 'text-warning-strong',
  },
  danger: {
    badge: 'bg-danger-soft text-danger',
    icon: 'bg-danger-soft text-danger',
    value: 'text-danger',
  },
  neutral: {
    badge: 'bg-surface-muted text-ink-soft',
    icon: 'bg-surface-muted text-ink-soft',
    value: 'text-ink',
  },
}

function StatTile({
  label,
  value,
  meta,
  tone,
  badge,
  icon: Icon,
}: {
  label: string
  value: React.ReactNode
  meta?: React.ReactNode
  tone: keyof typeof TONES
  badge?: string
  icon: React.ElementType
}) {
  const styles = TONES[tone]

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-ink-muted">{label}</p>
          <div className={`text-2xl font-bold ${styles.value}`}>{value}</div>
        </div>
        <div className={`rounded-xl p-2.5 ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        {meta ? <div className="text-xs text-ink-soft">{meta}</div> : <div />}
        {badge ? (
          <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${styles.badge}`}>
            {badge}
          </span>
        ) : null}
      </div>
    </article>
  )
}

export default function UnifiedStatsCards({ stats }: UnifiedStatsCardsProps) {
  const [activeTab, setActiveTab] = useState<'breeding' | 'production'>(
    stats.section_type === 'production' ? 'production' : 'breeding'
  )

  const showSwitcher = stats.level !== 'section' || stats.section_type === null

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(num)

  const renderCurrency = (num: number, tone: keyof typeof TONES = 'success') => (
    <span className={`inline-flex items-center gap-2 ${TONES[tone].value}`}>
      <span>{formatNumber(num)}</span>
      <SaudiRiyalIcon size={18} className={TONES[tone].value} />
    </span>
  )

  return (
    <section className="space-y-5">
      {showSwitcher ? (
        <div className="flex w-fit rounded-2xl border border-line bg-surface-muted p-1">
          <button
            onClick={() => setActiveTab('breeding')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'breeding'
                ? 'bg-surface text-action-primary'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            مؤشرات مرحلة التربية
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === 'production'
                ? 'bg-surface text-action-secondary'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            مؤشرات مرحلة الإنتاج
          </button>
        </div>
      ) : null}

      {activeTab === 'breeding' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="عدد الدخول"
              value={`${formatNumber(stats.breeding_stats.entry_birds)} طير`}
              meta="إجمالي الصيصان المدخلة"
              tone="info"
              badge="بداية الدورة"
              icon={Users}
            />
            <StatTile
              label="العدد الحالي"
              value={`${formatNumber(stats.breeding_stats.exit_birds)} طير`}
              meta="الطيور الحية المتبقية"
              tone="success"
              badge="نشط"
              icon={TrendingUp}
            />
            <StatTile
              label="النفوق"
              value={`${formatNumber(stats.breeding_stats.mortality_breeding)} طير`}
              meta={`النسبة ${stats.breeding_stats.mortality_rate}%`}
              tone="danger"
              badge="مراقبة"
              icon={Activity}
            />
            <StatTile
              label="قيمة النافق"
              value={renderCurrency(stats.breeding_stats.mortality_value, 'warning')}
              meta="الخسائر التقديرية"
              tone="warning"
              icon={Scale}
            />
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-action-primary" />
              <h3 className="text-sm font-bold text-ink">تفاصيل التكلفة التشغيلية لمرحلة التربية</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <StatTile
                label="تكلفة الصيصان"
                value={renderCurrency(stats.breeding_stats.chick_cost, 'neutral')}
                tone="neutral"
                icon={Users}
              />
              <StatTile
                label="تكلفة الأعلاف"
                value={renderCurrency(stats.breeding_stats.feed_cost, 'neutral')}
                tone="neutral"
                icon={Scale}
              />
              <StatTile
                label="التكلفة البيطرية"
                value={renderCurrency(stats.breeding_stats.vet_cost, 'neutral')}
                tone="neutral"
                icon={Activity}
              />
              <StatTile
                label="المصروفات الأخرى"
                value={renderCurrency(stats.breeding_stats.other_cost, 'neutral')}
                tone="neutral"
                icon={Briefcase}
              />
              <StatTile
                label="إجمالي تكلفة الأفواج"
                value={renderCurrency(stats.breeding_stats.total_value, 'success')}
                tone="success"
                badge="إجمالي"
                icon={TrendingUp}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="الكرتون المنتج"
            value={`${formatNumber(stats.production_stats.cartons_produced)} كرتون`}
            meta={`عدد البيض الكلي: ${formatNumber(stats.production_stats.total_eggs)} بيضة`}
            tone="success"
            badge="إنتاج"
            icon={Egg}
          />
          <StatTile
            label="الأعلاف المستهلكة"
            value={`${formatNumber(stats.production_stats.feed_consumed_ton)} طن`}
            meta="إجمالي الأعلاف الموزعة"
            tone="warning"
            icon={Scale}
          />
          <StatTile
            label="معدل الإنتاج"
            value={`${stats.production_stats.average_production_rate}%`}
            meta="متوسط النسبة اليومية"
            tone="info"
            icon={Percent}
          />
          <StatTile
            label="النفوق في الإنتاج"
            value={`${formatNumber(stats.production_stats.mortality_production)} طير`}
            meta={`النسبة ${stats.production_stats.mortality_rate}%`}
            tone="danger"
            icon={Activity}
          />
        </div>
      )}
    </section>
  )
}
