'use client'

import type { EggWeightDistribution } from '@/lib/types'
import Link from 'next/link'
import { Info, Settings } from 'lucide-react'

interface EggWeightDistributionMatrixProps {
  analytics: {
    egg_weight_distribution: EggWeightDistribution
  }
}

function formatNum(value: number, decimals = 0) {
  return value.toLocaleString('ar-EG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function formatNullable(value: number | null, decimals = 2) {
  return value === null ? '-' : formatNum(value, decimals)
}

export function EggWeightDistributionMatrix({ analytics }: EggWeightDistributionMatrixProps) {
  const { rows, summary } = analytics.egg_weight_distribution

  if (!rows || rows.length === 0) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm" dir="rtl">
        <div className="flex items-center gap-2 text-ink-muted">
          <Info className="h-5 w-5" />
          <span>لا توجد بيانات توزيع أوزان البيض متاحة</span>
        </div>
      </section>
    )
  }

  const totalEggs = summary.total_eggs
  const totalCartons = summary.total_cartons
  const totalPlates = summary.total_plates
  const totalWeightTon = rows.reduce((sum, row) => sum + row.total_weight_ton, 0)
  const count = rows.length
  const avgEggWeightGram = count > 0
    ? rows.reduce((sum, row) => sum + row.egg_weight_gram, 0) / count
    : 0

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm" dir="rtl">
      <div className="flex flex-col gap-4 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold text-ink-muted">Egg Matrix</p>
          <h2 className="mt-1 text-base font-bold text-ink">تفاصيل أوزان وأعداد البيض</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-surface-muted px-3 py-2">
            <p className="text-xs font-semibold text-ink-muted">عدد البيض</p>
            <p className="mt-1 font-mono text-sm font-bold text-ink">{formatNum(totalEggs)}</p>
          </div>
          <div className="rounded-xl bg-surface-muted px-3 py-2">
            <p className="text-xs font-semibold text-ink-muted">عدد الكرتون</p>
            <p className="mt-1 font-mono text-sm font-bold text-ink">{formatNum(totalCartons, 2)}</p>
          </div>
          <div className="rounded-xl bg-surface-muted px-3 py-2">
            <p className="text-xs font-semibold text-ink-muted">عدد الأطباق</p>
            <p className="mt-1 font-mono text-sm font-bold text-ink">{formatNum(totalPlates, 2)}</p>
          </div>
          <div className="rounded-xl bg-surface-muted px-3 py-2">
            <p className="text-xs font-semibold text-ink-muted">متوسط الجرام</p>
            <p className="mt-1 font-mono text-sm font-bold text-ink">{formatNum(avgEggWeightGram, 2)}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:hidden">
        {rows.map((row) => (
          <article key={row.size_code} className="rounded-xl border border-line bg-surface-subtle p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-ink">{row.label_ar}</h3>
                <p className="text-xs text-ink-muted">{row.label_en}</p>
              </div>
              <span className="rounded-lg bg-action-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-action-primary">
                {formatNum(row.percentage, 2)}%
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-semibold text-ink-muted">عدد البيض</p>
                <p className="mt-1 font-mono font-bold text-ink">{formatNum(row.eggs)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-muted">عدد الكرتون</p>
                <p className="mt-1 font-mono font-bold text-ink">{formatNum(row.cartons, 3)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-muted">عدد الأطباق</p>
                <p className="mt-1 font-mono font-bold text-ink">{formatNum(row.plates, 2)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-muted">وزن البيضة</p>
                <p className="mt-1 font-mono font-bold text-ink">{formatNum(row.egg_weight_gram, 2)} جم</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-surface px-3 py-2 text-xs text-ink-soft">
              الوزن من {formatNullable(row.weight_from)} إلى {formatNullable(row.weight_to)}، متوسط {formatNullable(row.avg_weight)}، إجمالي الوزن {formatNum(row.total_weight_ton, 4)} طن
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 hidden lg:block">
        <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-xl border border-line text-right text-sm">
          <thead>
            <tr className="bg-surface-muted text-xs text-ink-muted">
              <th className="w-[18%] border-b border-line px-3 py-3 font-bold text-ink">البيان</th>
              <th className="border-b border-line px-3 py-3 font-bold">عدد البيض</th>
              <th className="border-b border-line px-3 py-3 font-bold">عدد الكرتون</th>
              <th className="border-b border-line px-3 py-3 font-bold">عدد الأطباق</th>
              <th className="border-b border-line px-3 py-3 font-bold">نسبة الأوزان</th>
              <th className="border-b border-line px-3 py-3 font-bold">وزن البيضة</th>
              <th className="border-b border-line px-3 py-3 font-bold">إجمالي الوزن</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.size_code} className={index % 2 === 0 ? 'bg-surface' : 'bg-surface-subtle'}>
                <td className="border-b border-line px-3 py-3">
                  <div className="font-bold text-ink">{row.label_ar}</div>
                  <div className="text-xs text-ink-muted">{row.label_en}</div>
                </td>
                <td className="border-b border-line px-3 py-3 font-mono text-ink">{formatNum(row.eggs)}</td>
                <td className="border-b border-line px-3 py-3 font-mono text-ink">{formatNum(row.cartons, 3)}</td>
                <td className="border-b border-line px-3 py-3 font-mono text-ink">{formatNum(row.plates, 2)}</td>
                <td className="border-b border-line px-3 py-3 font-mono font-bold text-action-primary">{formatNum(row.percentage, 2)}%</td>
                <td className="border-b border-line px-3 py-3 font-mono text-ink">{formatNum(row.egg_weight_gram, 2)} جم</td>
                <td className="border-b border-line px-3 py-3 font-mono text-ink">{formatNum(row.total_weight_ton, 4)} طن</td>
              </tr>
            ))}
            <tr className="bg-action-primary/5 font-bold text-action-primary">
              <td className="px-3 py-3">الإجمالي</td>
              <td className="px-3 py-3 font-mono">{formatNum(totalEggs)}</td>
              <td className="px-3 py-3 font-mono">{formatNum(totalCartons, 3)}</td>
              <td className="px-3 py-3 font-mono">{formatNum(totalPlates, 2)}</td>
              <td className="px-3 py-3 font-mono">100%</td>
              <td className="px-3 py-3 font-mono">{formatNum(avgEggWeightGram, 2)} جم</td>
              <td className="px-3 py-3 font-mono">{formatNum(totalWeightTon, 4)} طن</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-warning/20 bg-warning-soft/60 p-4 text-xs text-warning-strong md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>البيانات المعيارية للأوزان يمكن تعديلها من إعدادات النظام.</span>
        </div>
        <Link
          href="/standards/egg-sizes"
          className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg bg-warning px-3 text-xs font-bold text-ink-inverse transition-colors hover:bg-warning-strong md:self-auto"
        >
          <Settings className="h-3.5 w-3.5" />
          تعديل البيانات
        </Link>
      </div>
    </section>
  )
}
