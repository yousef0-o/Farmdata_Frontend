'use client'

import React, { useMemo, useState } from 'react'
import { Filter, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { CriticalAlertStrip } from '@/components/dashboard/CriticalAlertStrip'
import { TodaySummaryRow } from '@/components/dashboard/TodaySummaryRow'
import { FlockWatchlistTable } from '@/components/dashboard/FlockWatchlistTable'
import { DashboardTrendsSection } from '@/components/dashboard/DashboardTrendsSection'
import { FeedRunwayWidget } from '@/components/dashboard/FeedRunwayWidget'
import { BarnOccupancyWidget } from '@/components/dashboard/BarnOccupancyWidget'
import { LifecycleEventsWidget } from '@/components/dashboard/LifecycleEventsWidget'
import { EggDistributionWidget } from '@/components/dashboard/EggDistributionWidget'
import { useMorningSummary } from '@/lib/hooks/useMorningSummary'
import { useFlocks } from '@/lib/hooks/useFlock'
import { useFlockAnalytics } from '@/lib/hooks/useFlockAnalytics'
import { organizationApi } from '@/lib/api/organization'
import type { AnalyticsScopeLevel } from '@/lib/types'
import type { MorningSummaryFilters } from '@/types/morningSummary'

type ScopeKind = Exclude<AnalyticsScopeLevel, 'flock'>

function todayDate() {
  return new Date().toISOString().slice(0, 10)
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

export default function DashboardPage() {
  const [filters, setFilters] = useState<MorningSummaryFilters>({
    date: todayDate(),
  })

  const morningSummary = useMorningSummary(filters)
  const activeFlocks = useFlocks('active', 1)
  const scope = activeScope(filters)

  const analyticsParams = useMemo(() => ({
    company_id: scope.level === 'company' ? scope.id : undefined,
    project_id: scope.level === 'project' ? scope.id : undefined,
    section_id: scope.level === 'section' ? scope.id : undefined,
    barn_id: scope.level === 'barn' ? scope.id : undefined,
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

  const projects = useQuery({
    queryKey: ['dashboard-filter-projects'],
    queryFn: organizationApi.listProjects,
  })

  const selectedCompany = companies.data?.data.find((company) => company.id === filters.company_id)
  const selectedProject = projects.data?.data.find((project) => project.id === filters.project_id)
  const sections =
    selectedProject?.sections ??
    selectedCompany?.projects?.flatMap((project) => project.sections ?? []) ??
    []
  const selectedSection = sections.find((section) => section.id === filters.section_id)
  const barns =
    selectedSection?.barns ??
    sections.flatMap((section) => section.barns ?? [])

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

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold text-ink-muted">Morning Command</p>
            <h1 className="mt-1 text-2xl font-bold text-dash-heading">لوحة قيادة الصباح</h1>
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
                <option value="">كل الشركات</option>
                {companies.data?.data.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-ink-muted">المشروع</span>
              <select
                value={filters.project_id ?? ''}
                onChange={(event) => handleFilterChange('project_id', event.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-action-primary"
              >
                <option value="">كل المشاريع</option>
                {(selectedCompany?.projects ?? projects.data?.data ?? []).map((project) => (
                  <option key={project.id} value={project.id}>{project.project_name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-bold text-ink-muted">القسم</span>
              <select
                value={filters.section_id ?? ''}
                onChange={(event) => handleFilterChange('section_id', event.target.value)}
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-action-primary"
              >
                <option value="">كل الأقسام</option>
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
                className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-action-primary"
              >
                <option value="">كل الحظائر</option>
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

      <TodaySummaryRow
        summary={morningSummary.data?.summary}
        isLoading={morningSummary.isLoading}
      />

      <FlockWatchlistTable
        watchlist={morningSummary.data?.watchlist ?? []}
        isLoading={morningSummary.isLoading}
      />

      <DashboardTrendsSection
        analytics={analytics.data}
        watchlist={morningSummary.data?.watchlist ?? []}
        isLoading={analytics.isLoading}
      />

      <FeedRunwayWidget
        items={morningSummary.data?.feed_runway ?? []}
        isLoading={morningSummary.isLoading}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <BarnOccupancyWidget
          flocks={activeFlocks.data?.data ?? []}
          isLoading={activeFlocks.isLoading}
        />
        <LifecycleEventsWidget
          watchlist={morningSummary.data?.watchlist ?? []}
          isLoading={morningSummary.isLoading}
        />
        <EggDistributionWidget
          distribution={analytics.data?.egg_weight_distribution}
          isLoading={analytics.isLoading}
          className="xl:col-span-1"
        />
      </div>
    </div>
  )
}
