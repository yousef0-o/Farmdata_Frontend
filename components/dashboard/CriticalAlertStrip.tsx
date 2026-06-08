'use client'

import React from 'react'
import {
  AlertTriangle,
  CalendarX2,
  CheckCircle2,
  HeartPulse,
  RefreshCw,
  Skull,
  type LucideIcon,
} from 'lucide-react'
import { useMorningSummary } from '@/lib/hooks/useMorningSummary'
import { Button } from '@/components/ui/Button'
import type {
  MorningSummaryFilters,
  MorningSummaryHealthAlert,
  MorningSummaryMissingDailyLogAlert,
  MorningSummaryMortalityAlert,
} from '../../types/morningSummary'

interface CriticalAlertStripProps {
  filters?: MorningSummaryFilters
  className?: string
}

interface AlertGroupProps<T> {
  title: string
  count: number
  icon: LucideIcon
  tone: 'danger' | 'warning' | 'info'
  items: T[]
  renderItem: (item: T) => React.ReactNode
}

const toneClasses = {
  danger: {
    icon: 'bg-danger-soft text-danger',
    badge: 'bg-danger-soft text-danger-strong',
    hover: 'hover:bg-danger-soft/35',
  },
  warning: {
    icon: 'bg-warning-soft text-warning',
    badge: 'bg-warning-soft text-warning-strong',
    hover: 'hover:bg-warning-soft/40',
  },
  info: {
    icon: 'bg-info-soft text-info',
    badge: 'bg-info-soft text-info-strong',
    hover: 'hover:bg-info-soft/40',
  },
}

function flockLabel(flockNumber: string | null, flockId: number) {
  return flockNumber ? `فوج ${flockNumber}` : `فوج #${flockId}`
}

function severityLabel(severity: string) {
  if (severity === 'high') return 'عالي'
  if (severity === 'medium') return 'متوسط'
  return 'منخفض'
}

function AlertGroup<T>({
  title,
  count,
  icon: Icon,
  tone,
  items,
  renderItem,
}: AlertGroupProps<T>) {
  const classes = toneClasses[tone]
  const visibleItems = items.slice(0, 3)

  return (
    <section className="min-w-0 rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${classes.icon}`}>
            <Icon className="h-4.5 w-4.5" />
          </span>
          <h3 className="truncate text-sm font-bold text-ink">{title}</h3>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${classes.badge}`}>
          {count.toLocaleString('ar-EG')}
        </span>
      </div>

      {visibleItems.length > 0 ? (
        <div className="space-y-1">
          {visibleItems.map((item, index) => (
            <div
              key={index}
              className={`rounded-xl px-3 py-2 text-sm transition-colors duration-150 ${classes.hover}`}
            >
              {renderItem(item)}
            </div>
          ))}
          {items.length > visibleItems.length && (
            <p className="px-3 pt-1 text-xs font-semibold text-ink-muted">
              +{(items.length - visibleItems.length).toLocaleString('ar-EG')} تنبيهات أخرى
            </p>
          )}
        </div>
      ) : (
        <p className="rounded-xl bg-surface-muted px-3 py-2 text-sm text-ink-muted">
          لا توجد تنبيهات في هذا القسم
        </p>
      )}
    </section>
  )
}

export function CriticalAlertStrip({
  filters = {},
  className = '',
}: CriticalAlertStripProps) {
  const { data, isLoading, isError, isFetching, refetch } = useMorningSummary(filters)

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 gap-3 lg:grid-cols-3 ${className}`} dir="rtl">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-2xl border border-line bg-surface"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className={`flex flex-col gap-3 rounded-2xl border border-warning bg-warning-soft p-4 text-warning-strong sm:flex-row sm:items-center sm:justify-between ${className}`}
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">تعذر تحميل تنبيهات الصباح</p>
            <p className="text-xs">راجع الاتصال بالخادم ثم أعد المحاولة.</p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
        >
          إعادة المحاولة
        </Button>
      </div>
    )
  }

  const mortalityAlerts = data?.alerts.mortality ?? []
  const missingDailyLogs = data?.alerts.missing_daily_logs ?? []
  const healthAlerts = data?.alerts.health ?? []
  const totalAlerts =
    mortalityAlerts.length + missingDailyLogs.length + healthAlerts.length

  if (totalAlerts === 0) {
    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border border-success/30 bg-success-soft p-4 text-success-strong shadow-sm ${className}`}
        dir="rtl"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-success">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold">كل حاجة تمام</p>
          <p className="text-xs">
            لا توجد تنبيهات نفوق أو سجلات يومية ناقصة أو حالات صحية حرجة.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 gap-3 lg:grid-cols-3 ${className}`} dir="rtl">
      <AlertGroup<MorningSummaryMortalityAlert>
        title="تنبيهات النفوق"
        count={mortalityAlerts.length}
        icon={Skull}
        tone="danger"
        items={mortalityAlerts}
        renderItem={(alert) => (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-bold text-ink">
                {flockLabel(alert.flock_number, alert.flock_id)}
              </p>
              <span className="shrink-0 text-xs font-bold text-danger">
                {severityLabel(alert.severity)}
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              {alert.barn_name ?? 'عنبر غير محدد'}: {alert.mortality_today.toLocaleString('ar-EG')} نفوق، نسبة {alert.mortality_rate_today.toLocaleString('ar-EG')}%
            </p>
          </div>
        )}
      />

      <AlertGroup<MorningSummaryMissingDailyLogAlert>
        title="السجلات اليومية الناقصة"
        count={missingDailyLogs.length}
        icon={CalendarX2}
        tone="warning"
        items={missingDailyLogs}
        renderItem={(alert) => (
          <div className="space-y-1">
            <p className="truncate font-bold text-ink">
              {flockLabel(alert.flock_number, alert.flock_id)}
            </p>
            <p className="text-xs text-ink-muted">
              {alert.barn_name ?? 'عنبر غير محدد'}: آخر تسجيل {alert.last_record_date ?? 'غير متوفر'}، متأخر {alert.missing_days.toLocaleString('ar-EG')} يوم
            </p>
          </div>
        )}
      />

      <AlertGroup<MorningSummaryHealthAlert>
        title="التنبيهات الصحية"
        count={healthAlerts.length}
        icon={HeartPulse}
        tone="info"
        items={healthAlerts}
        renderItem={(alert) => (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-bold text-ink">
                {flockLabel(alert.flock_number, alert.flock_id)}
              </p>
              <span className="shrink-0 text-xs font-bold text-info">
                {severityLabel(alert.severity)}
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              {alert.diagnosis ?? alert.clinical_signs ?? 'حالة صحية تحتاج متابعة'}، بتاريخ {alert.record_date}
            </p>
          </div>
        )}
      />
    </div>
  )
}
