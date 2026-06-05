'use client'

import React from 'react'
import { AlertTriangle, CheckCircle2, HeartPulse } from 'lucide-react'
import type {
  MorningSummaryRiskLevel,
  MorningSummarySeverity,
  MorningSummaryWatchlistItem,
} from '../../types/morningSummary'

interface FlockWatchlistTableProps {
  watchlist?: MorningSummaryWatchlistItem[]
  isLoading?: boolean
  className?: string
}

const flockTypeLabels = {
  production: 'إنتاج',
  breeding: 'تربية',
}

const riskClasses: Record<MorningSummaryRiskLevel, string> = {
  low: 'bg-success-soft text-success-strong',
  medium: 'bg-warning-soft text-warning-strong',
  high: 'bg-danger-soft text-danger-strong',
}

const severityClasses: Record<MorningSummarySeverity, string> = {
  low: 'bg-success-soft text-success-strong',
  medium: 'bg-warning-soft text-warning-strong',
  high: 'bg-danger-soft text-danger-strong',
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return value.toLocaleString('ar-EG', { maximumFractionDigits })
}

function riskLabel(level: MorningSummaryRiskLevel) {
  if (level === 'high') return 'مرتفع'
  if (level === 'medium') return 'متوسط'
  return 'منخفض'
}

function severityLabel(severity: MorningSummarySeverity | null) {
  if (!severity) return 'لا يوجد'
  if (severity === 'high') return 'عالي'
  if (severity === 'medium') return 'متوسط'
  return 'منخفض'
}

export function FlockWatchlistTable({
  watchlist = [],
  isLoading = false,
  className = '',
}: FlockWatchlistTableProps) {
  if (isLoading) {
    return (
      <section className={`rounded-2xl border border-line bg-surface p-5 shadow-sm ${className}`} dir="rtl">
        <div className="mb-4 h-6 w-44 animate-pulse rounded-lg bg-surface-muted" />
        <div className="space-y-3">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="h-12 animate-pulse rounded-xl bg-surface-muted" />
          ))}
        </div>
      </section>
    )
  }

  if (watchlist.length === 0) {
    return (
      <section className={`rounded-2xl border border-line bg-surface p-6 text-center shadow-sm ${className}`} dir="rtl">
        <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
        <h2 className="mt-3 text-base font-bold text-ink">لا توجد أفواج في قائمة المتابعة</h2>
        <p className="mt-1 text-sm text-ink-muted">لم يتم العثور على أفواج نشطة ضمن الفلاتر الحالية.</p>
      </section>
    )
  }

  return (
    <section className={`rounded-2xl border border-line bg-surface shadow-sm ${className}`} dir="rtl">
      <div className="flex flex-col gap-2 border-b border-line p-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">قائمة متابعة الأفواج</h2>
          <p className="text-sm text-ink-muted">مرتبة حسب درجة الخطورة الأعلى أولاً.</p>
        </div>
        <span className="text-xs font-bold text-ink-muted">
          {formatNumber(watchlist.length)} أفواج
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-right text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-subtle text-xs font-bold text-ink-muted">
              <th className="px-4 py-3">العنبر</th>
              <th className="px-4 py-3">الفوج</th>
              <th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">العمر</th>
              <th className="px-4 py-3">الطيور الحالية</th>
              <th className="px-4 py-3">النفوق اليوم</th>
              <th className="px-4 py-3">معدل الإنتاج</th>
              <th className="px-4 py-3">العلف اليوم</th>
              <th className="px-4 py-3">آخر تسجيل</th>
              <th className="px-4 py-3">الأيام الناقصة</th>
              <th className="px-4 py-3">الصحة</th>
              <th className="px-4 py-3">الخطورة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {watchlist.map((flock) => (
              <tr key={flock.flock_id} className="transition-colors duration-150 hover:bg-surface-muted/45">
                <td className="px-4 py-3">
                  <div className="font-bold text-ink">{flock.barn_name ?? 'غير محدد'}</div>
                  <div className="text-xs text-ink-muted">{flock.section_name ?? flock.project_name ?? flock.company_name ?? 'نطاق غير محدد'}</div>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-action-primary">
                  {flock.flock_number ?? `#${flock.flock_id}`}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-ink-soft">
                    {flockTypeLabels[flock.flock_type]}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-ink">
                  {flock.age_days === null ? 'غير متوفر' : `${formatNumber(flock.age_days)} يوم`}
                </td>
                <td className="px-4 py-3 font-mono font-semibold text-ink">
                  {formatNumber(flock.current_birds)}
                </td>
                <td className="px-4 py-3">
                  <div className="font-mono font-bold text-ink">{formatNumber(flock.mortality_today)}</div>
                  <div className="text-xs text-ink-muted">{formatNumber(flock.mortality_rate_today, 2)}%</div>
                </td>
                <td className="px-4 py-3 font-mono text-ink">
                  {flock.flock_type === 'production' && flock.production_rate_today !== null
                    ? `${formatNumber(flock.production_rate_today, 2)}%`
                    : 'غير مطبق'}
                </td>
                <td className="px-4 py-3 font-mono text-ink">
                  {formatNumber(flock.feed_kg_today, 1)} كجم
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {flock.last_record_date ?? 'لا يوجد'}
                </td>
                <td className="px-4 py-3">
                  {flock.missing_daily_log ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning-strong">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {formatNumber(flock.missing_days)} يوم
                    </span>
                  ) : (
                    <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-bold text-success-strong">
                      مكتمل
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {flock.health_severity ? (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${severityClasses[flock.health_severity]}`}>
                      <HeartPulse className="h-3.5 w-3.5" />
                      {severityLabel(flock.health_severity)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-ink-muted">
                      لا يوجد
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${riskClasses[flock.risk_level]}`}>
                    {riskLabel(flock.risk_level)}
                  </span>
                  <div className="mt-1 text-xs text-ink-muted">{formatNumber(flock.risk_score)} نقطة</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
