'use client'

import React, { useMemo, useState } from 'react'
import { AlertCircle, Filter, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { CriticalAlertStrip } from '@/components/dashboard/CriticalAlertStrip'
import { TodaySummaryRow } from '@/components/dashboard/TodaySummaryRow'
import { FlockWatchlistTable } from '@/components/dashboard/FlockWatchlistTable'
import { DashboardTrendsSection } from '@/components/dashboard/DashboardTrendsSection'
import { FeedRunwayWidget } from '@/components/dashboard/FeedRunwayWidget'
import { EggDistributionWidget } from '@/components/dashboard/EggDistributionWidget'
import { useMorningSummary } from '@/lib/hooks/useMorningSummary'
import { useFlockAnalytics } from '@/lib/hooks/useFlockAnalytics'
import { organizationApi } from '@/lib/api/organization'
import type { AnalyticsScopeLevel } from '@/lib/types'
import type { MorningSummaryFilters } from '@/types/morningSummary'

type ScopeKind = Exclude<AnalyticsScopeLevel, 'all' | 'flock'>

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function daysBefore(date: string, days: number) {
  const value = new Date(`${date}T00:00:00`)
  value.setDate(value.getDate() - days)
  return value.toISOString().slice(0, 10)
}

function numberOrUndefined(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function activeScope(filters: MorningSummaryFilters): {
  level?: ScopeKind
  id?: number
} {
  if (filters.barn_id) return { level: 'barn', id: filters.barn_id }
  if (filters.section_id) return { level: 'section', id: filters.section_id }
  if (filters.project_id) return { level: 'project', id: filters.project_id }
  if (filters.company_id) return { level: 'company', id: filters.company_id }
  return {}
}

function scopeLabel(level?: ScopeKind) {
  if (level === 'company') return 'شركة'
  if (level === 'project') return 'مشروع'
  if (level === 'section') return 'قسم'
  if (level === 'barn') return 'عنبر'
  return 'كل النطاق'
}

function MorningSummaryErrorCard({
  title,
  message,
  onRetry,
  isRetrying,
  className = '',
}: {
  title: string
  message: string
  onRetry: () => void
  isRetrying: boolean
  className?: string
}) {
  return (
    <section className={`rounded-2xl border border-danger/30 bg-danger-soft p-5 text-danger-strong shadow-sm ${className}`} dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <h2 className="text-sm font-bold">{title}</h2>
            <p className="text-xs">{message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-danger/30 bg-surface px-3 py-2 text-xs font-bold text-danger-strong transition-colors duration-150 hover:bg-danger-soft"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          إعادة المحاولة
        </button>
      </div>
    </section>
  )
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<MorningSummaryFilters>({
    date: todayDate(),
  })

  const morningSummary = useMorningSummary(filters)
  const scope = activeScope(filters)

  const analyticsParams = useMemo(() => ({
    company_id: scope.level === 'company' ? scope.id : undefined,
    project_id: scope.level === 'project' ? scope.id : undefined,
    section_id: scope.level === 'section' ? scope.id : undefined,
    barn_id: scope.level === 'barn' ? scope.id : undefined,
    date_from: daysBefore(filters.date ?? todayDate(), 29),
    date_to: filters.date,
    aggregation: 'daily' as const,
    axis: 'date' as const,
    active_flocks_only: true,
  }), [filters.date, scope.id, scope.level])

  const analytics = useFlockAnalytics(analyticsParams)

  const companies = useQuery({
    queryKey: ['dashboard-filter-companies'],
    queryFn: organizationApi.listCompanies,
  })

  const companyProjects = useQuery({
    queryKey: ['dashboard-filter-company-projects', filters.company_id],
    queryFn: () => organizationApi.getCompany(filters.company_id!),
    enabled: Boolean(filters.company_id),
  })

  const projectSections = useQuery({
    queryKey: ['dashboard-filter-project-sections', filters.project_id],
    queryFn: () => organizationApi.getProject(filters.project_id!),
    enabled: Boolean(filters.project_id),
  })

  const sectionBarns = useQuery({
    queryKey: ['dashboard-filter-section-barns', filters.section_id],
    queryFn: () => organizationApi.getSection(filters.section_id!),
    enabled: Boolean(filters.section_id),
  })

  const projects = companyProjects.data?.data.projects ?? []
  const sections = projectSections.data?.data.sections ?? []
  const barns = sectionBarns.data?.data.barns ?? []

  const handleFilterChange = (key: keyof MorningSummaryFilters, value: string) => {
    setFilters((current) => {
      const next: MorningSummaryFilters = { ...current }

      if (key === 'date') {
        next.date = value || todayDate()
        return next
      }

      const parsed = numberOrUndefined(value)
      if (parsed) next[key] = parsed
      else delete next[key]

      if (key === 'company_id') {
        delete next.project_id
        delete next.section_id
        delete next.barn_id
      }
      if (key === 'project_id') {
        delete next.section_id
        delete next.barn_id
      }
      if (key === 'section_id') {
        delete next.barn_id
      }

      return next
    })
  }

  const clearFilters = () => setFilters({ date: todayDate() })
  const hasMorningSummaryError = morningSummary.isError
  const morningSummaryData = hasMorningSummaryError ? undefined : morningSummary.data
  const watchlist = morningSummaryData?.watchlist

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted">Morning Command</p>
            <h1 className="mt-1 text-2xl font-bold text-dash-heading">لوحة التحكم</h1>
            <p className="mt-1 text-sm text-ink-muted">
              نطاق العرض: {scopeLabel(scope.level)}
              {scope.id ? ` #${scope.id}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <label className="space-y-1">
              <span className="text-xs font-bold text-ink-muted">التاريخ</span>
              <input
                type="date"
                value={filters.date ?? todayDate()}
                onChange={(event) => handleFilterChange('date', event.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-action-primary"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-ink-muted">الشركة</span>
              <select
                value={filters.company_id ?? ''}
                onChange={(event) => handleFilterChange('company_id', event.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-action-primary"
              >
                <option value="">
                  {companies.isLoading ? 'جاري تحميل الشركات...' : 'كل الشركات'}
                </option>
                {companies.data?.data.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
                {!companies.isLoading && companies.data?.data.length === 0 && (
                  <option value="" disabled>لا توجد شركات متاحة</option>
                )}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-ink-muted">المشروع</span>
              <select
                value={filters.project_id ?? ''}
                onChange={(event) => handleFilterChange('project_id', event.target.value)}
                disabled={!filters.company_id || companyProjects.isLoading || projects.length === 0}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-action-primary"
              >
                <option value="">
                  {!filters.company_id
                    ? 'اختر شركة أولاً'
                    : companyProjects.isLoading
                      ? 'جاري تحميل المشاريع...'
                      : projects.length === 0
                        ? 'لا توجد مشاريع لهذه الشركة'
                        : 'كل المشاريع'}
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.project_name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-ink-muted">القسم</span>
              <select
                value={filters.section_id ?? ''}
                onChange={(event) => handleFilterChange('section_id', event.target.value)}
                disabled={!filters.project_id || projectSections.isLoading || sections.length === 0}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-action-primary"
              >
                <option value="">
                  {!filters.project_id
                    ? 'اختر مشروعاً أولاً'
                    : projectSections.isLoading
                      ? 'جاري تحميل الأقسام...'
                      : sections.length === 0
                        ? 'لا توجد أقسام لهذا المشروع'
                        : 'كل الأقسام'}
                </option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.section_name ?? section.name ?? `قسم #${section.id}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-ink-muted">العنبر</span>
              <select
                value={filters.barn_id ?? ''}
                onChange={(event) => handleFilterChange('barn_id', event.target.value)}
                disabled={!filters.section_id || sectionBarns.isLoading || barns.length === 0}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-action-primary"
              >
                <option value="">
                  {!filters.section_id
                    ? 'اختر قسماً أولاً'
                    : sectionBarns.isLoading
                      ? 'جاري تحميل الحظائر...'
                      : barns.length === 0
                        ? 'لا توجد حظائر لهذا القسم'
                        : 'كل الحظائر'}
                </option>
                {barns.map((barn) => (
                  <option key={barn.id} value={barn.id}>
                    {barn.barn_name ?? barn.name ?? `عنبر #${barn.id}`}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => morningSummary.refetch()}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-action-primary px-3 text-sm font-bold text-ink-inverse transition-colors hover:bg-action-primary-hover"
              >
                <RefreshCw className={`h-4 w-4 ${morningSummary.isFetching ? 'animate-spin' : ''}`} />
                تحديث
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-surface px-3 text-ink-muted transition-colors hover:text-ink"
                aria-label="مسح الفلاتر"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <CriticalAlertStrip filters={filters} />

      {hasMorningSummaryError ? (
        <MorningSummaryErrorCard
          title="تعذر تحميل مؤشرات الصباح"
          message="لم يتم عرض قيم صفرية بديلة لأن بيانات المؤشرات لم تصل من الخادم."
          onRetry={() => morningSummary.refetch()}
          isRetrying={morningSummary.isFetching}
        />
      ) : (
        <TodaySummaryRow
          summary={morningSummaryData?.summary}
          isLoading={morningSummary.isLoading}
        />
      )}

      {hasMorningSummaryError ? (
        <MorningSummaryErrorCard
          title="تعذر تحميل قائمة متابعة الأفواج"
          message="لم يتم عرض جدول فارغ بديل لأن بيانات المتابعة لم تصل من الخادم."
          onRetry={() => morningSummary.refetch()}
          isRetrying={morningSummary.isFetching}
        />
      ) : (
        <FlockWatchlistTable
          watchlist={watchlist ?? []}
          isLoading={morningSummary.isLoading}
        />
      )}

      {hasMorningSummaryError ? (
        <MorningSummaryErrorCard
          title="تعذر تحميل بيانات النفوق للرسوم"
          message="لم يتم عرض مخطط نفوق فارغ لأن بيانات المتابعة لم تصل من الخادم."
          onRetry={() => morningSummary.refetch()}
          isRetrying={morningSummary.isFetching}
        />
      ) : analytics.isError ? (
        <MorningSummaryErrorCard
          title="تعذر تحميل تحليلات الإنتاج"
          message="طلب /api/statistics لم يكتمل بنجاح للنطاق المختار أو كل النطاق. لم يتم عرض رسم فارغ حتى لا يبدو كأنه بيانات فعلية."
          onRetry={() => analytics.refetch()}
          isRetrying={analytics.isFetching}
        />
      ) : (
        <DashboardTrendsSection
          analytics={analytics.data}
          watchlist={watchlist ?? []}
          isLoading={analytics.isLoading}
        />
      )}

      {hasMorningSummaryError ? (
        <MorningSummaryErrorCard
          title="تعذر تحميل مدى كفاية الأعلاف"
          message="لم يتم عرض مخزون أعلاف فارغ لأن بيانات feed runway لم تصل من الخادم."
          onRetry={() => morningSummary.refetch()}
          isRetrying={morningSummary.isFetching}
        />
      ) : (
        <FeedRunwayWidget
          items={morningSummaryData?.feed_runway ?? []}
          isLoading={morningSummary.isLoading}
        />
      )}

      {analytics.isError ? (
        <MorningSummaryErrorCard
          title="تعذر تحميل توزيع أوزان البيض"
          message="طلب /api/statistics لم يكتمل بنجاح للنطاق المختار أو كل النطاق."
          onRetry={() => analytics.refetch()}
          isRetrying={analytics.isFetching}
        />
      ) : (
        <EggDistributionWidget
          distribution={analytics.data?.egg_weight_distribution}
          isLoading={analytics.isLoading}
        />
      )}
    </div>
  )
}
