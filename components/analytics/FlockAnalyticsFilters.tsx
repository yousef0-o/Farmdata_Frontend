'use client'

import type { FlockAnalyticsResponse } from '@/lib/types'

type ScopeLevel = FlockAnalyticsResponse['meta']['level']

export type FlockAnalyticsFilterState = {
  level: ScopeLevel
  company_id?: number
  project_id?: number
  section_id?: number
  barn_id?: number
  flock_id?: number
  year: number
  aggregation: FlockAnalyticsResponse['meta']['aggregation']
  axis: FlockAnalyticsResponse['meta']['axis']
  active_flocks_only: boolean
}

interface FlockAnalyticsFiltersProps {
  filters: FlockAnalyticsResponse['filters']
  value: FlockAnalyticsFilterState
  onChange: (next: FlockAnalyticsFilterState) => void
}

const scopeOrder: Array<{ value: ScopeLevel; label: string }> = [
  { value: 'company', label: 'شركة' },
  { value: 'project', label: 'مشروع' },
  { value: 'section', label: 'قسم' },
  { value: 'barn', label: 'حظيرة' },
  { value: 'flock', label: 'فوج' },
]

function selectClassName() {
  return 'h-11 rounded-2xl border border-line bg-surface px-4 text-sm font-medium text-ink outline-none transition-colors focus:border-action-primary focus:ring-2 focus:ring-[var(--focus-ring)]'
}

export function FlockAnalyticsFilters({
  filters,
  value,
  onChange,
}: FlockAnalyticsFiltersProps) {
  const update = (patch: Partial<FlockAnalyticsFilterState>) => {
    onChange({ ...value, ...patch })
  }

  const setLevel = (level: ScopeLevel) => {
    onChange({
      level,
      company_id: value.company_id,
      project_id: level === 'project' || level === 'section' || level === 'barn' || level === 'flock' ? value.project_id : undefined,
      section_id: level === 'section' || level === 'barn' || level === 'flock' ? value.section_id : undefined,
      barn_id: level === 'barn' || level === 'flock' ? value.barn_id : undefined,
      flock_id: level === 'flock' ? value.flock_id : undefined,
      year: value.year,
      aggregation: value.aggregation,
      axis: value.axis,
      active_flocks_only: value.active_flocks_only,
    })
  }

  return (
    <section className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">Analytics Scope</p>
            <h2 className="text-lg font-bold text-ink">مرشحات لوحة التحليل</h2>
          </div>

          <div className="inline-flex w-full flex-wrap gap-2 rounded-2xl bg-surface-muted p-1 lg:w-auto">
            {scopeOrder.map((scope) => (
              <button
                key={scope.value}
                type="button"
                onClick={() => setLevel(scope.value)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  value.level === scope.value
                    ? 'bg-surface text-action-primary shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                {scope.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-ink-soft">
            <span>الشركة</span>
            <select
              className={selectClassName()}
              value={value.company_id ?? ''}
              onChange={(event) => update({ company_id: event.target.value ? Number(event.target.value) : undefined })}
            >
              <option value="">اختر شركة</option>
              {filters.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-ink-soft">
            <span>المشروع</span>
            <select
              className={selectClassName()}
              value={value.project_id ?? ''}
              onChange={(event) => update({ project_id: event.target.value ? Number(event.target.value) : undefined })}
            >
              <option value="">كل المشاريع</option>
              {filters.projects
                .filter((project) => !value.company_id || project.company_id === value.company_id)
                .map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-ink-soft">
            <span>القسم</span>
            <select
              className={selectClassName()}
              value={value.section_id ?? ''}
              onChange={(event) => update({ section_id: event.target.value ? Number(event.target.value) : undefined })}
            >
              <option value="">كل الأقسام</option>
              {filters.sections
                .filter((section) => !value.project_id || section.project_id === value.project_id)
                .map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-ink-soft">
            <span>الحظيرة</span>
            <select
              className={selectClassName()}
              value={value.barn_id ?? ''}
              onChange={(event) => update({ barn_id: event.target.value ? Number(event.target.value) : undefined })}
            >
              <option value="">كل الحظائر</option>
              {filters.barns
                .filter((barn) => !value.section_id || barn.section_id === value.section_id)
                .map((barn) => (
                  <option key={barn.id} value={barn.id}>
                    {barn.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-ink-soft">
            <span>السنة</span>
            <select
              className={selectClassName()}
              value={value.year}
              onChange={(event) => update({ year: Number(event.target.value) })}
            >
              {filters.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-ink-soft">
            <span>مستوى التجميع</span>
            <select
              className={selectClassName()}
              value={value.aggregation}
              onChange={(event) => update({ aggregation: event.target.value as FlockAnalyticsFilterState['aggregation'] })}
            >
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">كل 28 يوم</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-ink-soft">
            <span>المحور الأفقي</span>
            <select
              className={selectClassName()}
              value={value.axis}
              onChange={(event) => update({ axis: event.target.value as FlockAnalyticsFilterState['axis'] })}
            >
              <option value="date">التاريخ</option>
              <option value="age">العمر</option>
            </select>
          </label>

          <label className="flex items-center justify-between rounded-2xl border border-line bg-surface-subtle px-4 py-3 text-sm font-medium text-ink">
            <span>الأفواج النشطة فقط</span>
            <button
              type="button"
              aria-pressed={value.active_flocks_only}
              onClick={() => update({ active_flocks_only: !value.active_flocks_only })}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                value.active_flocks_only ? 'bg-action-primary' : 'bg-line'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-surface transition-transform ${
                  value.active_flocks_only ? 'right-1' : 'right-6'
                }`}
              />
            </button>
          </label>
        </div>
      </div>
    </section>
  )
}
