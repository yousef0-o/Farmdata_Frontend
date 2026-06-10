'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Download, Loader2 } from 'lucide-react'
import { useFlockAnalytics } from '@/lib/hooks/useFlockAnalytics'
import type { FlockAnalyticsResponse } from '@/lib/types'
import { organizationApi } from '@/lib/api/organization'
import { statisticsApi } from '@/lib/api/statistics'
import {
  FlockAnalyticsFilters,
  type FlockAnalyticsFilterState,
} from '@/components/analytics/FlockAnalyticsFilters'
import { FlockAnalyticsCards } from '@/components/analytics/FlockAnalyticsCards'
import { CodexGoalWidget } from '@/components/analytics/CodexGoalWidget'
import { EggWeightDistributionMatrix } from '@/components/analytics/EggWeightDistributionMatrix'
import { FlockAnalyticsChart } from '@/components/analytics/FlockAnalyticsChart'
import { AnnualMovementPanel } from '@/components/analytics/AnnualMovementPanel'

function buildScopeParams(filters: FlockAnalyticsFilterState) {
  return {
    flock_id: filters.level === 'flock' ? filters.flock_id : undefined,
    barn_id: filters.level === 'barn' ? filters.barn_id : undefined,
    section_id: filters.level === 'section' ? filters.section_id : undefined,
    project_id: filters.level === 'project' ? filters.project_id : undefined,
    company_id: filters.level === 'company' ? filters.company_id : undefined,
    year: filters.year,
    aggregation: filters.aggregation,
    axis: filters.axis,
    active_flocks_only: filters.active_flocks_only,
  }
}

function inferInitialFilters(data: FlockAnalyticsResponse): FlockAnalyticsFilterState {
  const scope = data.meta.scope
  return {
    level: data.meta.level,
    company_id: scope.company_id ?? undefined,
    project_id: scope.project_id ?? undefined,
    section_id: scope.section_id ?? undefined,
    barn_id: scope.barn_id ?? undefined,
    flock_id: scope.flock_id ?? undefined,
    year: data.meta.year,
    aggregation: data.meta.aggregation,
    axis: data.meta.axis,
    active_flocks_only: data.meta.active_flocks_only,
  }
}

export default function FlockAnalyticsPage() {
  const companiesQuery = useQuery({
    queryKey: ['companies', 'analytics-bootstrap'],
    queryFn: () => organizationApi.listCompanies(),
  })

  const [manualFilters, setManualFilters] = useState<FlockAnalyticsFilterState | null>(null)
  const defaultCompanyId = companiesQuery.data?.data?.[0]?.id
  const bootstrapParams = defaultCompanyId
    ? {
        company_id: defaultCompanyId,
        year: new Date().getFullYear(),
        aggregation: 'daily' as const,
        axis: 'date' as const,
        active_flocks_only: true,
      }
    : null

  const bootstrap = useFlockAnalytics(bootstrapParams ?? {})
  const derivedFilters = useMemo(() => {
    if (manualFilters) {
      return manualFilters
    }

    if (bootstrap.data) {
      const defaults = inferInitialFilters(bootstrap.data)
      if (!defaults.company_id && bootstrap.data.filters.companies[0]) {
        defaults.company_id = bootstrap.data.filters.companies[0].id
      }
      return defaults
    }

    if (defaultCompanyId) {
      return {
        level: 'company' as const,
        company_id: defaultCompanyId,
        year: new Date().getFullYear(),
        aggregation: 'daily' as const,
        axis: 'date' as const,
        active_flocks_only: true,
      }
    }

    return null
  }, [bootstrap.data, defaultCompanyId, manualFilters])

  const params = useMemo(
    () => (derivedFilters ? buildScopeParams(derivedFilters) : null),
    [derivedFilters]
  )

  const analyticsQuery = useFlockAnalytics(params ?? {})
  const [isExporting, setIsExporting] = useState(false)

  const analytics = analyticsQuery.data ?? bootstrap.data

  const handleExport = async () => {
    if (!params) return
    setIsExporting(true)
    try {
      const blob = await statisticsApi.exportFlockAnalytics(params)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `farmdata_statistics_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  if ((companiesQuery.isLoading || bootstrap.isLoading) && !analytics) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-action-primary" />
      </div>
    )
  }

  if (!analytics || analyticsQuery.isError) {
    return (
      <div className="rounded-[1.8rem] border border-danger/20 bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-ink">تعذر تحميل لوحة التحليل</h1>
        <p className="mt-2 text-sm text-ink-soft">تحقق من إعدادات النطاق المختار أو الاتصال بالخادم ثم أعد المحاولة.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="overflow-hidden rounded-[2rem] border border-line bg-surface shadow-sm">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(194,65,12,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(28,59,43,0.18),transparent_28%),linear-gradient(180deg,rgba(250,249,246,0.98),rgba(255,255,255,1))] px-6 py-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">Flock Statistics</p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-ink">لوحة إحصائيات وتحليلات القطيع</h1>
              <p className="mt-2 max-w-[60ch] text-sm text-ink-soft">
                مؤشرات مرحلتي التربية والإنتاج، مع مقارنة مباشرة ضد أهداف Codex وحسابات FCR ونسبة الإنتاج وتوزيع أحجام البيض.
              </p>
            </div>
            <div className="grid gap-2 text-sm text-ink-soft md:grid-cols-3">
              <div className="rounded-2xl bg-surface/80 px-4 py-3">
                <div className="text-xs text-ink-muted">النطاق الحالي</div>
                <div className="mt-1 font-semibold text-ink">{analytics.meta.scope.label}</div>
              </div>
              <div className="rounded-2xl bg-surface/80 px-4 py-3">
                <div className="text-xs text-ink-muted">نوع المرحلة</div>
                <div className="mt-1 font-semibold text-ink">
                  {analytics.meta.stage === 'production' ? 'إنتاج' : analytics.meta.stage === 'breeding' ? 'تربية' : 'مختلط'}
                </div>
              </div>
              <div className="rounded-2xl bg-surface/80 px-4 py-3">
                <div className="text-xs text-ink-muted">عدد الأفواج</div>
                <div className="mt-1 font-semibold text-ink">{analytics.meta.flock_count.toLocaleString('en-US')}</div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || !params}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 text-sm font-bold text-ink-soft transition-colors hover:bg-surface-subtle hover:text-ink disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            تصدير CSV
          </button>
        </div>
      </section>

      <FlockAnalyticsFilters
        filters={analytics.filters}
        value={derivedFilters ?? inferInitialFilters(analytics)}
        onChange={setManualFilters}
      />

      {analyticsQuery.isFetching ? (
        <div className="flex items-center justify-center rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
          <Loader2 className="ml-3 h-4 w-4 animate-spin text-action-primary" />
          يتم تحديث التحليلات حسب المرشحات المختارة
        </div>
      ) : null}

      <FlockAnalyticsCards analytics={analytics} />
      <CodexGoalWidget analytics={analytics} />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <FlockAnalyticsChart analytics={analytics} />
        <section className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">Stage Router</p>
          <h2 className="mt-2 text-xl font-bold text-ink">حالة المرحلة</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-surface-subtle px-4 py-4">
              <div className="text-xs text-ink-muted">المسار الحالي</div>
              <div className="mt-1 text-lg font-bold text-ink">
                {analytics.stage_router.current === 'production'
                  ? 'بطاقات الإنتاج'
                  : analytics.stage_router.current === 'breeding'
                    ? 'بطاقات التربية'
                    : 'مزيج تربية وإنتاج'}
              </div>
            </div>
            <div className="rounded-2xl border border-line px-4 py-4">
              <div className="text-sm font-semibold text-ink">التقييمات الفورية</div>
              <div className="mt-3 grid gap-2 text-sm text-ink-soft">
                <div className="flex items-center justify-between">
                  <span>Lay Rate</span>
                  <span className="font-semibold text-ink">{analytics.summary.production.evaluations.lay_rate.label_ar}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>FCR</span>
                  <span className="font-semibold text-ink">{analytics.summary.production.evaluations.fcr.label_ar}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mortality</span>
                  <span className="font-semibold text-ink">{analytics.summary.production.evaluations.mortality_rate.label_ar}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <EggWeightDistributionMatrix analytics={analytics} />
      <AnnualMovementPanel analytics={analytics} />
    </div>
  )
}
