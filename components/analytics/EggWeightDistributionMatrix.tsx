'use client'

import type { FlockAnalyticsResponse, EggWeightDistribution } from '@/lib/types'
import { Info, Settings } from 'lucide-react'

interface EggWeightDistributionMatrixProps {
  analytics: {
    egg_weight_distribution: EggWeightDistribution
  }
}

export function EggWeightDistributionMatrix({ analytics }: EggWeightDistributionMatrixProps) {
  const { rows, summary } = analytics.egg_weight_distribution

  if (!rows || rows.length === 0) {
    return (
      <section className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm">
        <div className="flex items-center gap-2 text-ink-muted">
          <Info className="h-5 w-5" />
          <span>لا توجد بيانات توزيع أوزان البيض متاحة</span>
        </div>
      </section>
    )
  }

  // Pre-calculate averages/totals for standard rows
  const count = rows.length
  const totalCartons = summary.total_cartons
  const totalPlates = summary.total_plates
  const totalEggs = summary.total_eggs
  const totalPercentage = rows.reduce((sum, r) => sum + r.percentage, 0)

  const avgWeightFrom = count > 0 ? rows.reduce((sum, r) => sum + (r.weight_from ?? 0), 0) / count : 0
  const avgWeightTo = count > 0 ? rows.reduce((sum, r) => sum + (r.weight_to ?? 0), 0) / count : 0
  const avgAvgWeight = count > 0 ? rows.reduce((sum, r) => sum + (r.avg_weight ?? 0), 0) / count : 0
  const avgEggWeightGram = count > 0 ? rows.reduce((sum, r) => sum + r.egg_weight_gram, 0) / count : 0
  const totalWeightTon = rows.reduce((sum, r) => sum + r.total_weight_ton, 0)

  const formatNum = (num: number, decimals = 0) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  return (
    <section className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-line pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">Egg Matrix</p>
          <h2 className="text-xl font-bold text-ink">تفاصيل أوزان وأعداد البيض</h2>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-ink-soft">
          <span>الإجمالي: {formatNum(totalEggs)} بيضة</span>
          <span>كراتين: {formatNum(totalCartons, 2)}</span>
          <span>أطباق: {formatNum(totalPlates, 2)}</span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-center text-sm">
          <thead>
            <tr className="bg-surface-subtle">
              <th className="border border-line px-4 py-3 text-right font-bold text-ink min-w-[150px]">البيان</th>
              {rows.map((row) => (
                <th key={row.size_code} className="border border-line px-3 py-2 text-center min-w-[90px]">
                  <div className="font-bold text-ink">{row.label_ar}</div>
                  <div className="text-[10px] text-ink-muted font-normal">{row.label_en}</div>
                </th>
              ))}
              <th className="border border-line px-4 py-3 text-center bg-action-primary/10 text-action-primary font-bold min-w-[110px]">
                الإجمالي
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {/* Row 1: عدد الكرتون */}
            <tr className="hover:bg-surface-muted/40 transition-colors">
              <td className="border border-line px-4 py-3 text-right font-semibold bg-surface-subtle/40 text-ink">عدد الكرتون</td>
              {rows.map((row) => (
                <td key={`${row.size_code}-cartons`} className="border border-line px-3 py-3 font-mono text-ink">
                  {formatNum(row.cartons, 3)}
                </td>
              ))}
              <td className="border border-line px-4 py-3 font-mono font-bold bg-action-primary/5 text-action-primary">
                {formatNum(totalCartons, 3)}
              </td>
            </tr>

            {/* Row 2: عدد الأطباق */}
            <tr className="hover:bg-surface-muted/40 transition-colors">
              <td className="border border-line px-4 py-3 text-right font-semibold bg-surface-subtle/40 text-ink">عدد الأطباق</td>
              {rows.map((row) => (
                <td key={`${row.size_code}-plates`} className="border border-line px-3 py-3 font-mono text-ink">
                  {formatNum(row.plates, 2)}
                </td>
              ))}
              <td className="border border-line px-4 py-3 font-mono font-bold bg-action-primary/5 text-action-primary">
                {formatNum(totalPlates, 2)}
              </td>
            </tr>

            {/* Row 3: عدد البيض */}
            <tr className="hover:bg-surface-muted/40 transition-colors">
              <td className="border border-line px-4 py-3 text-right font-semibold bg-surface-subtle/40 text-ink">عدد البيض</td>
              {rows.map((row) => (
                <td key={`${row.size_code}-eggs`} className="border border-line px-3 py-3 font-mono text-ink">
                  {formatNum(row.eggs)}
                </td>
              ))}
              <td className="border border-line px-4 py-3 font-mono font-bold bg-action-primary/5 text-action-primary">
                {formatNum(totalEggs)}
              </td>
            </tr>

            {/* Row 4: نسبة الأوزان */}
            <tr className="hover:bg-surface-muted/40 transition-colors">
              <td className="border border-line px-4 py-3 text-right font-semibold bg-surface-subtle/40 text-ink">نسبة الأوزان</td>
              {rows.map((row) => (
                <td key={`${row.size_code}-pct`} className="border border-line px-3 py-3 font-mono text-ink">
                  {row.percentage.toFixed(2)}%
                </td>
              ))}
              <td className="border border-line px-4 py-3 font-mono font-bold bg-action-primary/5 text-action-primary">
                {totalPercentage.toFixed(2)}%
              </td>
            </tr>

            {/* Row 5: الوزن من */}
            <tr className="bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-100/30 transition-colors text-amber-900 dark:text-amber-300">
              <td className="border border-line px-4 py-3 text-right font-semibold bg-amber-50/50 dark:bg-amber-950/20">الوزن من</td>
              {rows.map((row) => (
                <td key={`${row.size_code}-w-from`} className="border border-line px-3 py-3 font-mono">
                  {row.weight_from !== null ? row.weight_from.toFixed(2) : '-'}
                </td>
              ))}
              <td className="border border-line px-4 py-3 font-mono font-semibold bg-amber-100/50 dark:bg-amber-950/30">
                {avgWeightFrom.toFixed(2)}
              </td>
            </tr>

            {/* Row 6: الوزن إلى */}
            <tr className="bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-100/30 transition-colors text-amber-900 dark:text-amber-300">
              <td className="border border-line px-4 py-3 text-right font-semibold bg-amber-50/50 dark:bg-amber-950/20">الوزن إلى</td>
              {rows.map((row) => (
                <td key={`${row.size_code}-w-to`} className="border border-line px-3 py-3 font-mono">
                  {row.weight_to !== null ? row.weight_to.toFixed(2) : '-'}
                </td>
              ))}
              <td className="border border-line px-4 py-3 font-mono font-semibold bg-amber-100/50 dark:bg-amber-950/30">
                {avgWeightTo.toFixed(2)}
              </td>
            </tr>

            {/* Row 7: متوسط الوزن */}
            <tr className="bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-100/30 transition-colors text-amber-900 dark:text-amber-300">
              <td className="border border-line px-4 py-3 text-right font-semibold bg-amber-50/50 dark:bg-amber-950/20">متوسط الوزن</td>
              {rows.map((row) => (
                <td key={`${row.size_code}-w-avg`} className="border border-line px-3 py-3 font-mono">
                  {row.avg_weight !== null ? row.avg_weight.toFixed(2) : '-'}
                </td>
              ))}
              <td className="border border-line px-4 py-3 font-mono font-semibold bg-amber-100/50 dark:bg-amber-950/30">
                {avgAvgWeight.toFixed(2)}
              </td>
            </tr>

            {/* Row 8: وزن البيضة بالجرام */}
            <tr className="bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-100/30 transition-colors text-amber-900 dark:text-amber-300">
              <td className="border border-line px-4 py-3 text-right font-semibold bg-amber-50/50 dark:bg-amber-950/20">وزن البيضة بالجرام</td>
              {rows.map((row) => (
                <td key={`${row.size_code}-w-gram`} className="border border-line px-3 py-3 font-mono">
                  {row.egg_weight_gram.toFixed(2)}
                </td>
              ))}
              <td className="border border-line px-4 py-3 font-mono font-semibold bg-amber-100/50 dark:bg-amber-950/30">
                {avgEggWeightGram.toFixed(2)}
              </td>
            </tr>

            {/* Row 9: إجمالي الوزن بالطن */}
            <tr className="bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-100/30 transition-colors text-emerald-900 dark:text-emerald-300 font-bold">
              <td className="border border-line px-4 py-3 text-right bg-emerald-50/50 dark:bg-emerald-950/20">إجمالي الوزن بالطن</td>
              {rows.map((row) => (
                <td key={`${row.size_code}-w-ton`} className="border border-line px-3 py-3 font-mono">
                  {row.total_weight_ton.toFixed(4)}
                </td>
              ))}
              <td className="border border-line px-4 py-3 font-mono bg-emerald-100/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
                {totalWeightTon.toFixed(4)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-800 dark:text-amber-300 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>البيانات المعيارية (الوزن من/إلى، متوسط الوزن، وزن البيضة) يمكن تعديلها من لوحة التحكم الإدارية.</span>
        </div>
        <button
          type="button"
          onClick={() => alert('تعديل البيانات المعيارية متاح للمسؤولين فقط من خلال لوحة الإعدادات العامة.')}
          className="flex items-center gap-1.5 self-start rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 px-3 py-2 font-medium text-white transition-colors shadow-sm md:self-auto"
        >
          <Settings className="h-3.5 w-3.5" />
          تعديل البيانات المعيارية
        </button>
      </div>
    </section>
  )
}

