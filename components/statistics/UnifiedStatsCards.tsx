'use client'

import React from 'react'
import { EntityStatistics } from '@/lib/types'
import {
  Activity,
  Briefcase,
  Egg,
  Percent,
  Scale,
  TrendingUp,
  Users,
  Package,
  Target,
} from 'lucide-react'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'

interface UnifiedStatsCardsProps {
  stats: EntityStatistics
  isBreedingOnly?: boolean
  title?: string
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
    <article className="rounded-2xl border border-line bg-surface p-4 shadow-sm hover:shadow-md transition-shadow">
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

export default function UnifiedStatsCards({ stats, isBreedingOnly: propIsBreedingOnly, title }: UnifiedStatsCardsProps) {
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

  const isBreedingOnly = propIsBreedingOnly ?? (stats.section_type === 'breeding')

  return (
    <section className="space-y-8">
      {/* 1. إحصائيات التربية */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-line pb-2">
          <div className="p-2 bg-blue-50 text-farm-blue rounded-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold text-ink">إحصائيات التربية</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="الداخل للتربية"
            value={`${formatNumber(stats.breeding_stats.entry_birds)} طير`}
            meta="إجمالي الصيصان المدخلة"
            tone="info"
            badge="بداية الدورة"
            icon={Users}
          />
          <StatTile
            label="الخارج من التربية"
            value={`${formatNumber(stats.breeding_stats.exit_birds)} طير`}
            meta="الطيور الحية المتبقية"
            tone="success"
            badge="الخروج للإنتاج"
            icon={TrendingUp}
          />
          <StatTile
            label="نافق التربية"
            value={`${formatNumber(stats.breeding_stats.mortality_breeding)} طير`}
            meta={`النسبة ${formatNumber(stats.breeding_stats.mortality_rate)}%`}
            tone="danger"
            badge="إجمالي النافق"
            icon={Activity}
          />
          <StatTile
            label="قيمة نافق التربية"
            value={renderCurrency(stats.breeding_stats.mortality_value, 'danger')}
            meta="الخسائر التقديرية للتربية"
            tone="danger"
            icon={Scale}
          />
          <StatTile
            label="قيمة الصوص"
            value={renderCurrency(stats.breeding_stats.chick_cost, 'neutral')}
            tone="neutral"
            icon={Users}
          />
          <StatTile
            label="قيمة الأعلاف"
            value={renderCurrency(stats.breeding_stats.feed_cost, 'neutral')}
            tone="neutral"
            icon={Scale}
          />
          <StatTile
            label="قيمة البيطرة"
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
            label="نسبة نافق التربية"
            value={`${formatNumber(stats.breeding_stats.mortality_rate)}%`}
            meta="معدل نفوق فترة الحضانة"
            tone="danger"
            icon={Percent}
          />

          {!isBreedingOnly && (
            <>
              <StatTile
                label="(ملف بيانات الفوج)المستهدف كرتون"
                value={`${formatNumber(stats.production_stats.target_carton || 0)}`}
                meta="المستهدف المخطط"
                tone="info"
                icon={Package}
              />
              <StatTile
                label="المستهدف القياسي كرتون"
                value={`${formatNumber(stats.production_stats.standard_target_carton || 0)}`}
                meta="حسب الدليل القياسي"
                tone="info"
                icon={Target}
              />
              <StatTile
                label="المستهدف التشغيلي كرتون"
                value={`${formatNumber(stats.production_stats.operational_target_carton || 0)}`}
                meta="حسب الخطة التشغيلية"
                tone="info"
                icon={Package}
              />
            </>
          )}

          <StatTile
            label="إجمالي قيمة الفوج/الافواج"
            value={renderCurrency(stats.breeding_stats.total_value, 'success')}
            tone="success"
            badge="إجمالي التكلفة"
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* 2. إحصائيات الإنتاجية */}
      {!isBreedingOnly && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-line pb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Egg className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-ink">إحصائيات الإنتاجية</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatTile
              label="عدد الكرتون المنتج"
              value={`${formatNumber(stats.production_stats.cartons_produced)} كرتون`}
              meta={`إجمالي البيض: ${formatNumber(stats.production_stats.total_eggs)} بيضة`}
              tone="success"
              badge="الإنتاج الفعلي"
              icon={Egg}
            />
            <StatTile
              label="إجمالي العلف المستهلك"
              value={`${formatNumber(stats.production_stats.feed_consumed_ton)} طن`}
              meta="خلال فترة الإنتاج"
              tone="warning"
              icon={Scale}
            />
            <StatTile
              label="إجمالي النافق"
              value={`${formatNumber(stats.production_stats.mortality_production)} طير`}
              meta={`مجموع نفوق الإنتاج`}
              tone="danger"
              icon={Activity}
            />
            <StatTile
              label="قيمة نافق الإنتاج"
              value={renderCurrency(stats.production_stats.mortality_value, 'danger')}
              meta="خسائر نفوق الإنتاج"
              tone="danger"
              icon={Scale}
            />
            <StatTile
              label="نسبة الإنتاج"
              value={`${formatNumber(stats.production_stats.average_production_rate)}%`}
              meta="معدل إنتاج البيض اليومي"
              tone="info"
              icon={Percent}
            />
            <StatTile
              label="نسبة نافق الإنتاج"
              value={`${formatNumber(stats.production_stats.mortality_rate)}%`}
              meta="معدل نفوق فترة الإنتاج"
              tone="danger"
              icon={Percent}
            />
          </div>
        </div>
      )}

      {/* 3. توزيع أحجام البيض */}
      {!isBreedingOnly && stats.production_stats.egg_sizes_distribution && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-line pb-2">
            <div className="p-2 bg-blue-50 text-farm-blue rounded-lg">
              <Egg className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-ink">توزيع أحجام البيض</h2>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm overflow-x-auto">
            <div className="flex gap-3 min-w-max">
              {(() => {
                const distribution = stats.production_stats.egg_sizes_distribution || {
                  B: 0,
                  BD: 0,
                  SD: 0,
                  SS: 0,
                  S: 0,
                  M: 0,
                  L2: 0,
                  L1: 0,
                  XL: 0,
                  XXL: 0,
                  J: 0,
                  F2: 0,
                  SSS: 0,
                }

                const distItems = [
                  { label: 'B', value: distribution.B },
                  { label: 'B-D', value: distribution.BD },
                  { label: 'S-D', value: distribution.SD },
                  { label: 'SS', value: distribution.SS },
                  { label: 'S', value: distribution.S },
                  { label: 'M', value: distribution.M },
                  { label: 'L2', value: distribution.L2 },
                  { label: 'L1', value: distribution.L1 },
                  { label: 'XL', value: distribution.XL },
                  { label: 'XXL', value: distribution.XXL },
                  { label: 'J', value: distribution.J },
                  { label: 'F2', value: distribution.F2 },
                  { label: 'SSS', value: distribution.SSS },
                ]

                const totalDistQuantity = distItems.reduce((acc, item) => acc + item.value, 0)

                return distItems.map((item) => {
                  const pct = totalDistQuantity > 0 ? ((item.value / totalDistQuantity) * 100).toFixed(1) : '0.0'
                  return (
                    <div
                      key={item.label}
                      className="flex-1 min-w-[100px] rounded-xl bg-slate-50 border border-slate-100 p-3 text-center flex flex-col justify-between items-center gap-1"
                    >
                      <span className="text-xs font-bold text-farm-blue">{item.label}</span>
                      <span className="text-sm font-bold text-slate-800">{formatNumber(item.value / 360)}</span>
                      <span className="text-xs font-semibold text-emerald-600">{pct}%</span>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 4. حركة الإنتاج السنوية */}
      {!isBreedingOnly && stats.annual_movement && stats.annual_movement.length > 0 && (
        <div className="space-y-4 mt-8">
          <div className="flex items-center gap-3 border-b border-line pb-2">
            <div className="p-2 bg-blue-50 text-farm-blue rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-ink">
              حركة الإنتاج السنوية لـ {title || 'الموقع'}
            </h2>
          </div>

          {/* Cards for totals */}
          {(() => {
            const annualMovement = stats.annual_movement || []
            const totalCartons = annualMovement.reduce((sum, row) => sum + row.cartons_produced, 0)
            const totalEggs = annualMovement.reduce((sum, row) => sum + row.eggs_produced, 0)
            const totalCumulativeBirds = annualMovement.reduce((sum, row) => sum + row.cumulative_birds, 0)
            const totalEntering = annualMovement.reduce((sum, row) => sum + row.birds_entering_production, 0)
            const totalMortality = annualMovement.reduce((sum, row) => sum + row.mortality_count, 0)
            const totalFeed = annualMovement.reduce((sum, row) => sum + row.feed_consumption, 0)
            const totalTarget = annualMovement.reduce((sum, row) => sum + row.target_cartons, 0)
            const totalDiff = totalCartons - totalTarget
            const totalRate = totalCumulativeBirds > 0 ? (totalEggs / totalCumulativeBirds) * 100 : 0

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 mb-1">إجمالي الكراتين</div>
                    <div className="text-xl font-bold text-farm-blue">{formatNumber(totalCartons)}</div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 mb-1">إجمالي البيض</div>
                    <div className="text-xl font-bold text-emerald-600">{formatNumber(totalEggs)}</div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 mb-1">نسبة الإنتاج الكلية</div>
                    <div className="text-xl font-bold text-sky-500">{totalRate.toFixed(2)}%</div>
                  </div>
                  <div className="rounded-xl border border-line bg-surface p-4 text-center shadow-sm">
                    <div className="text-xs font-semibold text-slate-500 mb-1">إجمالي الأعلاف</div>
                    <div className="text-xl font-bold text-amber-600">{formatNumber(totalFeed)} طن</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm overflow-x-auto">
                  <table className="w-full text-sm border-collapse text-right">
                    <thead>
                      <tr className="border-b border-line bg-slate-50 text-slate-700 font-bold">
                        <th className="p-3 text-center">السنة</th>
                        <th className="p-3 text-center">الكرتون المنتج</th>
                        <th className="p-3 text-center">البيض المنتج</th>
                        <th className="p-3 text-center">عدد الطيور الداخل</th>
                        <th className="p-3 text-center">العدد التراكمي</th>
                        <th className="p-3 text-center">نسبة الإنتاج %</th>
                        <th className="p-3 text-center">النافق</th>
                        <th className="p-3 text-center">الأعلاف (طن)</th>
                        <th className="p-3 text-center">المستهدف</th>
                        <th className="p-3 text-center">الفرق</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {annualMovement.map((row) => {
                        const isDiffPositive = row.cartons_difference >= 0
                        const rateColor = row.production_rate >= 80 ? 'text-emerald-600' : (row.production_rate >= 70 ? 'text-amber-500' : 'text-rose-600')
                        return (
                          <tr key={row.year} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-center font-bold bg-slate-50 text-slate-800">{row.year}</td>
                            <td className="p-3 text-center text-slate-700 font-semibold">{formatNumber(row.cartons_produced)}</td>
                            <td className="p-3 text-center text-slate-700">{formatNumber(row.eggs_produced)}</td>
                            <td className="p-3 text-center text-slate-700">{formatNumber(row.birds_entering_production)}</td>
                            <td className="p-3 text-center text-slate-800 font-semibold">{formatNumber(row.cumulative_birds)}</td>
                            <td className={`p-3 text-center font-bold ${rateColor}`}>{row.production_rate.toFixed(2)}%</td>
                            <td className="p-3 text-center text-rose-600 font-bold">{formatNumber(row.mortality_count)}</td>
                            <td className="p-3 text-center text-slate-700">{formatNumber(row.feed_consumption)}</td>
                            <td className="p-3 text-center text-slate-700">{formatNumber(row.target_cartons)}</td>
                            <td className={`p-3 text-center font-bold ${isDiffPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatNumber(Math.abs(row.cartons_difference))}
                              {!isDiffPositive && '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50 text-emerald-950 font-bold border-t border-line">
                        <td className="p-3 text-center">الإجمالي</td>
                        <td className="p-3 text-center">{formatNumber(totalCartons)}</td>
                        <td className="p-3 text-center">{formatNumber(totalEggs)}</td>
                        <td className="p-3 text-center">{formatNumber(totalEntering)}</td>
                        <td className="p-3 text-center">{formatNumber(totalCumulativeBirds)}</td>
                        <td className="p-3 text-center">{totalRate.toFixed(2)}%</td>
                        <td className="p-3 text-center text-rose-600">{formatNumber(totalMortality)}</td>
                        <td className="p-3 text-center">{formatNumber(totalFeed)}</td>
                        <td className="p-3 text-center">{formatNumber(totalTarget)}</td>
                        <td className={`p-3 text-center ${totalDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatNumber(Math.abs(totalDiff))}
                          {totalDiff < 0 && '-'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )
          })()}
        </div>
      )}
    </section>
  )
}
