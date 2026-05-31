'use client'

import React, { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Edit3,
  Eye,
  Filter,
  Layers3,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Route,
  Search,
  Sprout,
  Trash2,
  Trees,
  Warehouse,
  Waves,
} from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'
import { nurseryManagementApi } from '@/lib/api/nurseryManagement'
import { useNurseryManagement } from '@/lib/hooks/useNurseryManagement'
import type { ApiError } from '@/lib/types'
import type {
  NurseryCycle,
  NurseryCycleProcedureType,
  NurseryCycleStatus,
  NurseryManageBasinOption,
  NurseryManageFilterOptions,
  NurseryManageFilters,
  NurseryManageHierarchyNursery,
  NurseryManageLocationRow,
  NurseryManageVarietySize,
  NurseryPropagationType,
} from '@/lib/types/nurseryManagement'

const today = () => new Date().toISOString().slice(0, 10)

const propagationLabels: Record<NurseryPropagationType, string> = {
  seeds: 'بذور',
  cuttings: 'عقل',
  grafting: 'تطعيم',
  layering: 'ترقيد',
}

const statusLabels: Record<NurseryCycleStatus, string> = {
  active: 'نشطة',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
}

const procedureLabels: Record<NurseryCycleProcedureType, string> = {
  irrigation: 'ري',
  inspection: 'كشف',
  humidity: 'رطوبة',
}

const cycleSchema = z
  .object({
    basin_id: z.coerce.number().int().min(1, 'الحوض مطلوب'),
    name: z.string().trim().min(1, 'اسم دورة الإنتاج مطلوب').max(255),
    tree_type_id: z.coerce.number().int().min(1, 'نوع الشجرة مطلوب'),
    propagation_type: z.enum(['seeds', 'cuttings', 'grafting', 'layering']).nullable().optional(),
    source: z.string().trim().max(255).nullable().optional(),
    count: z.coerce.number().int().min(1, 'عدد البذور أو العقل مطلوب'),
    pot_size: z.string().trim().max(50).nullable().optional(),
    start_date: z.string().min(1, 'تاريخ البداية مطلوب'),
    end_date: z.string().nullable().optional(),
    status: z.enum(['active', 'completed', 'cancelled']).optional(),
  })
  .refine((values) => !values.end_date || values.end_date >= values.start_date, {
    path: ['end_date'],
    message: 'تاريخ النهاية المتوقع يجب أن يكون بعد تاريخ البداية أو مساويا له',
  })

const transferSchema = z
  .object({
    cycle_id: z.coerce.number().int().min(1),
    successful_count: z.coerce.number().int().min(0, 'عدد الشتلات الناجحة مطلوب'),
    mark_remaining_failed: z.boolean().optional(),
    transfer_date: z.string().nullable().optional(),
    lines: z
      .array(
        z.object({
          nursery_id: z.coerce.number().int().min(1, 'المشتل مطلوب'),
          location_id: z.coerce.number().int().min(1, 'الموقع مطلوب'),
          section_id: z.coerce.number().int().min(1, 'القسم مطلوب'),
          basin_id: z.coerce.number().int().min(1, 'الحوض مطلوب'),
          line_number: z.coerce.number().int().min(1, 'رقم الخط مطلوب'),
          quantity: z.coerce.number().int().min(1, 'الكمية مطلوبة'),
          pot_size: z.string().trim().max(50).nullable().optional(),
          tree_height: z.coerce.number().min(0).nullable().optional(),
        })
      )
      .min(1, 'يجب إضافة خط واحد على الأقل'),
  })
  .refine(
    (values) =>
      values.lines.reduce((total, line) => total + Number(line.quantity || 0), 0) <=
      Number(values.successful_count || 0),
    {
      path: ['lines'],
      message: 'عدد الأشجار المنقولة لا يمكن أن يتجاوز عدد الشتلات الناجحة',
    }
  )

const procedureSchema = z.object({
  cycle_id: z.coerce.number().int().min(1),
  procedure_type: z.enum(['irrigation', 'inspection', 'humidity']),
  procedure_date: z.string().min(1, 'تاريخ الإجراء مطلوب'),
  period: z.string().trim().max(50).nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  humidity_percentage: z.coerce.number().min(0).max(100).nullable().optional(),
  notes: z.string().trim().nullable().optional(),
})

type CycleFormValues = z.infer<typeof cycleSchema>
type CycleFormInput = z.input<typeof cycleSchema>
type TransferFormValues = z.infer<typeof transferSchema>
type TransferFormInput = z.input<typeof transferSchema>
type ProcedureFormValues = z.infer<typeof procedureSchema>
type ProcedureFormInput = z.input<typeof procedureSchema>

function apiErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') return fallback
  const apiError = error as ApiError
  if (typeof apiError.message === 'string' && apiError.message.trim()) return apiError.message
  if (apiError.errors) {
    const first = Object.values(apiError.errors)[0]
    if (first?.[0]) return first[0]
  }
  return fallback
}

function formatNumber(value: number | null | undefined, digits = 0) {
  return new Intl.NumberFormat('ar-EG', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value ?? 0))
}

function Button({
  children,
  tone = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'neutral' | 'green' | 'danger'
}) {
  const toneClass = {
    primary: 'bg-[#c2410c] text-white hover:bg-[#9a3412]',
    neutral:
      'border border-slate-100 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900',
    green: 'bg-emerald-600 text-white hover:bg-emerald-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }[tone]

  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${toneClass} ${props.className ?? ''}`}
    >
      {children}
    </button>
  )
}

function TextField({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <input
        {...props}
        className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-[#c2410c] focus:bg-white focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      />
      {error ? <p className="mt-1 text-xs font-bold text-red-600">{error}</p> : null}
    </label>
  )
}

function SelectField({
  label,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <select
        {...props}
        className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-[#c2410c] focus:bg-white focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        {children}
      </select>
      {error ? <p className="mt-1 text-xs font-bold text-red-600">{error}</p> : null}
    </label>
  )
}

function SummaryTile({
  label,
  value,
  unit,
  icon: Icon,
  tone = 'orange',
}: {
  label: string
  value: string
  unit?: string
  icon: typeof Sprout
  tone?: 'orange' | 'green'
}) {
  const color =
    tone === 'green'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
      : 'bg-orange-50 text-[#c2410c] dark:bg-orange-950/40 dark:text-orange-300'

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-950 dark:text-slate-50">
            {value}
            {unit ? <span className="mr-1 font-sans text-xs text-slate-500">{unit}</span> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: NurseryCycleStatus }) {
  const className = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900',
    completed: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800',
    cancelled: 'bg-red-50 text-red-700 ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900',
  }[status]

  return (
    <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ${className}`}>
      {statusLabels[status]}
    </span>
  )
}

function FilterBar({
  filters,
  setFilters,
  options,
}: {
  filters: NurseryManageFilters
  setFilters: React.Dispatch<React.SetStateAction<NurseryManageFilters>>
  options?: NurseryManageFilterOptions
}) {
  const [search, setSearch] = useState(filters.search ?? '')

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="بحث باسم الدورة أو المصدر"
            className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 py-2 pl-3 pr-10 text-sm font-semibold outline-none transition-all focus:border-[#c2410c] focus:bg-white focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>

        <select
          value={filters.status ?? ''}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              status: (event.target.value || null) as NurseryCycleStatus | null,
            }))
          }
          className="min-h-11 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none transition-all focus:border-[#c2410c] focus:bg-white focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">كل الحالات</option>
          <option value="active">نشطة</option>
          <option value="completed">مكتملة</option>
          <option value="cancelled">ملغاة</option>
        </select>

        <select
          value={filters.variety_id ?? ''}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              page: 1,
              variety_id: event.target.value ? Number(event.target.value) : null,
            }))
          }
          className="min-h-11 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none transition-all focus:border-[#c2410c] focus:bg-white focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">كل الأصناف</option>
          {options?.varieties.map((variety) => (
            <option key={variety.id} value={variety.id}>
              {variety.name}
            </option>
          ))}
        </select>

        <select
          value={`${filters.sort ?? 'created_at'}:${filters.direction ?? 'desc'}`}
          onChange={(event) => {
            const [sort, direction] = event.target.value.split(':') as [
              NurseryManageFilters['sort'],
              NurseryManageFilters['direction'],
            ]
            setFilters((current) => ({ ...current, sort, direction, page: 1 }))
          }}
          className="min-h-11 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none transition-all focus:border-[#c2410c] focus:bg-white focus:ring-2 focus:ring-orange-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="created_at:desc">الأحدث</option>
          <option value="start_date:desc">تاريخ البداية الأحدث</option>
          <option value="name:asc">الاسم تصاعدي</option>
          <option value="count:desc">العدد الأعلى</option>
        </select>

        <Button
          type="button"
          tone="neutral"
          onClick={() => setFilters((current) => ({ ...current, search, page: 1 }))}
        >
          <Filter className="h-4 w-4" />
          تطبيق
        </Button>
      </div>
    </div>
  )
}

function HierarchyPanel({
  hierarchy,
}: {
  hierarchy: NurseryManageHierarchyNursery[]
}) {
  if (!hierarchy.length) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <Warehouse className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-bold text-slate-500">لا توجد بيانات هيكلية لعرضها حاليا.</p>
      </div>
    )
  }

  const themes = [
    { bg: '#f0f9ff', border: '#0ea5e9', icon: '#e0f2fe', text: '#0369a1' },
    { bg: '#f0fdf4', border: '#22c55e', icon: '#dcfce7', text: '#15803d' },
    { bg: '#fefce8', border: '#eab308', icon: '#fef9c3', text: '#a16207' },
    { bg: '#fef2f2', border: '#ef4444', icon: '#fee2e2', text: '#b91c1c' },
    { bg: '#faf5ff', border: '#a855f7', icon: '#f3e8ff', text: '#7e22ce' },
    { bg: '#fff7ed', border: '#f97316', icon: '#ffedd5', text: '#c2410c' },
    { bg: '#f6f8fa', border: '#64748b', icon: '#e2e8f0', text: '#334155' },
    { bg: '#ecfeff', border: '#06b6d4', icon: '#cffafe', text: '#0e7490' },
  ]
  return (
    <div className="mb-12 flex flex-col gap-8">
      {hierarchy.map((nursery, nurseryIndex) => (
        <div
          key={nursery.id}
          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="flex min-h-16 flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
            <Warehouse className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            <div className="text-base font-extrabold text-slate-950 dark:text-slate-50">
              {nursery.name}
            </div>
            <a
              href={`/nursery/manage/general-operations?type=nursery&id=${nursery.id}`}
              className="mr-auto inline-flex min-h-8 items-center justify-center gap-2 rounded-lg border border-[#c2410c]/25 bg-white px-3 py-1 text-xs font-bold text-[#c2410c] transition-all active:scale-[0.98] hover:bg-orange-50 dark:border-orange-900 dark:bg-slate-950 dark:text-orange-300"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              عمليات عامة
            </a>
          </div>

          <div className="pb-1">
            {nursery.locations.map((location, locationIndex) => {
              const theme = themes[(nurseryIndex + locationIndex) % themes.length]

              return (
                <div
                  key={location.id}
                  className="m-6 rounded-lg border-r-[3px] bg-white dark:bg-slate-950"
                  style={{ borderRightColor: theme.border }}
                >
                  <div
                    className="flex min-h-14 flex-wrap items-center gap-3 px-4 py-3"
                    style={{
                      background: `linear-gradient(to left, ${theme.bg}, rgba(255,255,255,0))`,
                    }}
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-md"
                      style={{ background: theme.icon, color: theme.text }}
                    >
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div style={{ color: theme.text }}>
                      <div className="text-xs font-semibold opacity-80">{nursery.name}</div>
                      <div className="text-base font-extrabold">{location.name}</div>
                    </div>
                    <div className="mr-auto flex items-center gap-2">
                      <span className="rounded-md border border-slate-100 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                        {location.sections.length} قسم
                      </span>
                      <a
                        href={`/nursery/manage/general-operations?type=location&id=${location.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition-all active:scale-[0.98] dark:bg-slate-950"
                        style={{ borderColor: theme.border, color: theme.text }}
                        title="عمليات عامة على الموقع"
                      >
                        <ClipboardList className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 px-6 pb-6 pt-2">
                    {location.sections.map((section) => (
                      <div key={section.id} className="relative pr-6">
                        <div className="absolute bottom-0 right-0 top-0 w-px bg-slate-200 dark:bg-slate-800" />
                        <span className="absolute right-[-4px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#c2410c] bg-white dark:bg-slate-950" />

                        <div className="mb-3 flex min-h-8 flex-wrap items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            {section.name}
                            <span className="text-xs font-semibold text-slate-300 dark:text-slate-600">
                              ({section.basins.length} حوض)
                            </span>
                          </div>
                          <a
                            href={`/nursery/manage/general-operations?type=section&id=${section.id}`}
                            className="mr-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-100 bg-white text-sky-600 transition-all active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-sky-300"
                            title="عمليات عامة على القسم"
                          >
                            <ClipboardList className="h-3.5 w-3.5" />
                          </a>
                        </div>

                        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                          {section.basins.map((basin) => (
                            <a
                              key={basin.id}
                              href={`/nursery/manage/basins/${basin.id}`}
                              className="block min-h-[68px] rounded-[10px] border border-slate-200 bg-white p-3 text-inherit shadow-sm transition-all active:scale-[0.98] hover:-translate-y-0.5 hover:border-[#c2410c] hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                            >
                              <div className="overflow-hidden">
                                <span className="float-left rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                  {formatNumber(basin.total_trees)}
                                </span>
                                <div className="mb-1 flex items-center gap-1.5 text-sm font-extrabold text-slate-950 dark:text-slate-50">
                                  <span
                                    className="h-2 w-2 rounded-sm"
                                    style={{ background: theme.border }}
                                  />
                                  {basin.name}
                                </div>
                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                  {formatNumber(basin.length, 2)}×{formatNumber(basin.width, 2)}م
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function VarietyCards({
  sizes,
  onShowLocations,
}: {
  sizes: NurseryManageVarietySize[]
  onShowLocations: (size: NurseryManageVarietySize) => void
}) {
  if (!sizes.length) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <Sprout className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-bold text-slate-500">لا توجد أشجار مسجلة حاليا.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {sizes.map((size) => (
        <div
          key={`${size.variety_id}-${size.pot_size ?? 'empty'}`}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-950 dark:text-slate-50">
                {size.variety_name}
              </h3>
              <p className="mt-1 text-xs font-bold text-slate-500">
                مقاس: {size.pot_size || '-'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onShowLocations(size)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 transition-all active:scale-[0.98] dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
              aria-label="عرض المواقع"
            >
              <MapPin className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-xs font-bold text-slate-500">الكمية</div>
              <div className="mt-1 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {formatNumber(size.total_quantity)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-xs font-bold text-slate-500">قيمة المراكن</div>
              <div className="mt-1 font-mono text-lg font-bold text-[#c2410c] dark:text-orange-300">
                {formatNumber(size.pot_total_value, 2)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-xs font-bold text-slate-500">متوسط الطول</div>
              <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(size.avg_height, 2)} م
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-xs font-bold text-slate-500">متوسط السماكة</div>
              <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(size.avg_thickness, 2)} بوصة
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function LegacyHierarchyList({ hierarchy }: { hierarchy: NurseryManageHierarchyNursery[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({})

  function toggle(key: string) {
    setOpen((current) => ({ ...current, [key]: !current[key] }))
  }

  if (!hierarchy.length) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <Layers3 className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-bold text-slate-500">لا توجد بيانات لعرضها حاليا.</p>
        <a
          href="/nursery/locations"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#c2410c] px-4 py-2 text-sm font-bold text-white transition-all active:scale-[0.98] hover:bg-[#9a3412]"
        >
          إعداد هيكل المشتل
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {hierarchy.map((nursery) => {
        const nurseryKey = `nursery-${nursery.id}`
        const nurseryOpen = Boolean(open[nurseryKey])

        return (
          <div
            key={nursery.id}
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <button
              type="button"
              onClick={() => toggle(nurseryKey)}
              className="flex w-full flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-right transition-all active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
            >
              <ChevronLeft
                className={`h-4 w-4 text-slate-400 transition-transform ${nurseryOpen ? '-rotate-90' : ''}`}
              />
              <Warehouse className="h-5 w-5 text-[#c2410c]" />
              <span className="text-sm font-bold text-slate-950 dark:text-slate-50">
                {nursery.name}
              </span>
              <span className="rounded-xl bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                {formatNumber(nursery.total_trees)} شجرة
              </span>
              <a
                href={`/nursery/lines?nursery_id=${nursery.id}`}
                onClick={(event) => event.stopPropagation()}
                className="mr-auto inline-flex min-h-8 items-center justify-center gap-1 rounded-lg border border-slate-100 bg-white px-3 py-1 text-xs font-bold text-slate-700 transition-all active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              >
                عرض الخطوط
              </a>
            </button>

            {nurseryOpen ? (
              <div className="space-y-4 p-4">
                {nursery.locations.map((location) => {
                  const locationKey = `location-${location.id}`
                  const locationOpen = Boolean(open[locationKey])

                  return (
                    <div key={location.id} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => toggle(locationKey)}
                        className="flex w-full flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-right text-sky-700 transition-all active:scale-[0.99] hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/30"
                      >
                        <ChevronLeft
                          className={`h-4 w-4 transition-transform ${locationOpen ? '-rotate-90' : ''}`}
                        />
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm font-bold">{location.name}</span>
                        <span className="rounded-lg bg-sky-100 px-2 py-1 text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                          {formatNumber(location.total_trees)}
                        </span>
                        <a
                          href={`/nursery/lines?location_id=${location.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="mr-auto inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-100 bg-white px-3 py-1 text-xs font-bold text-slate-700 transition-all active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                        >
                          عرض الخطوط
                        </a>
                      </button>

                      {locationOpen ? (
                        <div className="mt-3 space-y-3 pr-5">
                          {location.sections.map((section) => {
                            const sectionKey = `section-${section.id}`
                            const sectionOpen = Boolean(open[sectionKey])

                            return (
                              <div
                                key={section.id}
                                className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggle(sectionKey)}
                                  className="flex w-full flex-wrap items-center gap-2 text-right transition-all active:scale-[0.99]"
                                >
                                  <ChevronLeft
                                    className={`h-4 w-4 text-slate-400 transition-transform ${sectionOpen ? '-rotate-90' : ''}`}
                                  />
                                  <Layers3 className="h-4 w-4 text-slate-500" />
                                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                    {section.name}
                                  </span>
                                  <span className="rounded-lg border border-slate-100 bg-white px-2 py-1 text-xs font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                                    {formatNumber(section.total_trees)}
                                  </span>
                                  <a
                                    href={`/nursery/lines?section_id=${section.id}`}
                                    onClick={(event) => event.stopPropagation()}
                                    className="mr-auto inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-100 bg-white px-3 py-1 text-xs font-bold text-slate-700 transition-all active:scale-[0.98] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                                  >
                                    عرض الخطوط
                                  </a>
                                </button>

                                {sectionOpen ? (
                                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
                                    <table className="min-w-full divide-y divide-slate-100 text-right dark:divide-slate-800">
                                      <thead className="bg-slate-50 dark:bg-slate-900">
                                        <tr>
                                          <th className="px-4 py-3 text-xs font-bold text-slate-500">الحوض</th>
                                          <th className="px-4 py-3 text-xs font-bold text-slate-500">الأبعاد</th>
                                          <th className="px-4 py-3 text-xs font-bold text-slate-500">إجمالي الأشجار</th>
                                          <th className="px-4 py-3 text-xs font-bold text-slate-500">نظام الري</th>
                                          <th className="px-4 py-3 text-xs font-bold text-slate-500">إجراءات</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {section.basins.map((basin) => (
                                          <tr key={basin.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                                            <td className="px-4 py-3 text-sm font-bold text-slate-950 dark:text-slate-50">
                                              {basin.name}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                              {formatNumber(basin.length, 2)}م x {formatNumber(basin.width, 2)}م
                                            </td>
                                            <td className="px-4 py-3 font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                              {formatNumber(basin.total_trees)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                              {basin.irrigation_method || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                              <a
                                                href={`/nursery/manage/basins/${basin.id}`}
                                                className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 transition-all active:scale-[0.98] hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300"
                                              >
                                                إدارة
                                                <ChevronLeft className="h-3 w-3" />
                                              </a>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : null}
                              </div>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function CycleTable({
  cycles,
  onEdit,
  onTransfer,
  onProcedure,
  onDelete,
}: {
  cycles: NurseryCycle[]
  onEdit: (cycle: NurseryCycle) => void
  onTransfer: (cycle: NurseryCycle) => void
  onProcedure: (cycle: NurseryCycle, type: NurseryCycleProcedureType) => void
  onDelete: (cycle: NurseryCycle) => void
}) {
  if (!cycles.length) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-bold text-slate-500">لا توجد دورات إنتاج مطابقة.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="hidden overflow-x-auto lg:block">
        <table className="min-w-full divide-y divide-slate-100 text-right dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              {['الدورة', 'الصنف', 'المكان', 'الإكثار', 'العدد', 'المركن', 'التواريخ', 'الحالة', 'تتبع', 'إجراءات'].map((heading) => (
                <th key={heading} className="px-4 py-3 text-xs font-bold text-slate-500">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {cycles.map((cycle) => (
              <tr key={cycle.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/70">
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-950 dark:text-slate-50">{cycle.name}</div>
                  <div className="text-xs font-semibold text-slate-500">{cycle.source || '-'}</div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold">{cycle.variety_name || '-'}</td>
                <td className="px-4 py-3 text-sm font-semibold">
                  {cycle.nursery?.name || '-'} / {cycle.location?.name || '-'} / {cycle.section?.name || '-'} / {cycle.basin?.name || '-'}
                </td>
                <td className="px-4 py-3 text-sm font-semibold">
                  {cycle.propagation_type ? propagationLabels[cycle.propagation_type] : '-'}
                </td>
                <td className="px-4 py-3 font-mono text-sm font-bold">{formatNumber(cycle.count)}</td>
                <td className="px-4 py-3 text-sm font-semibold">{cycle.pot_size || '-'}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-500">
                  {cycle.start_date || '-'} <ChevronLeft className="inline h-3 w-3" /> {cycle.end_date || '-'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={cycle.status} />
                </td>
                <td className="px-4 py-3 text-xs font-bold text-slate-500">
                  <div>نقل: {formatNumber(cycle.total_transferred)}</div>
                  <div>إنبات: {cycle.latest_germination_rate === null ? '-' : `${formatNumber(cycle.latest_germination_rate, 2)}%`}</div>
                  <div>إجراءات: {formatNumber(cycle.procedures_count)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-lg border border-slate-100 p-2 text-slate-600 transition-all active:scale-[0.98] dark:border-slate-800 dark:text-slate-300" onClick={() => onEdit(cycle)} aria-label="تعديل">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-emerald-700 transition-all active:scale-[0.98] dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" onClick={() => onTransfer(cycle)} aria-label="نقل">
                      <Route className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg border border-sky-100 bg-sky-50 p-2 text-sky-700 transition-all active:scale-[0.98] dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300" onClick={() => onProcedure(cycle, 'irrigation')} aria-label="ري">
                      <Waves className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg border border-red-100 bg-red-50 p-2 text-red-700 transition-all active:scale-[0.98] dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" onClick={() => onDelete(cycle)} aria-label="حذف">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 lg:hidden dark:divide-slate-800">
        {cycles.map((cycle) => (
          <div key={cycle.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50">{cycle.name}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">{cycle.variety_name || '-'}</p>
              </div>
              <StatusBadge status={cycle.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
              <span>{cycle.basin?.name || '-'}</span>
              <span>{formatNumber(cycle.count)} شتلة</span>
              <span>{cycle.pot_size || '-'}</span>
              <span>{cycle.start_date || '-'}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" tone="neutral" onClick={() => onEdit(cycle)}>
                <Edit3 className="h-4 w-4" />
                تعديل
              </Button>
              <Button type="button" tone="green" onClick={() => onTransfer(cycle)}>
                <Route className="h-4 w-4" />
                نقل
              </Button>
              <Button type="button" tone="neutral" onClick={() => onProcedure(cycle, 'humidity')}>
                <Waves className="h-4 w-4" />
                إجراء
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CycleDialog({
  open,
  cycle,
  defaultBasinId,
  options,
  onClose,
}: {
  open: boolean
  cycle: NurseryCycle | null
  defaultBasinId?: number
  options?: NurseryManageFilterOptions
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const form = useForm<CycleFormInput, unknown, CycleFormValues>({
    resolver: zodResolver(cycleSchema),
    values: {
      basin_id: cycle?.basin_id ?? defaultBasinId ?? 0,
      name: cycle?.name ?? '',
      tree_type_id: cycle?.tree_type_id ?? 0,
      propagation_type: cycle?.propagation_type ?? 'seeds',
      source: cycle?.source ?? '',
      count: cycle?.count ?? 1,
      pot_size: cycle?.pot_size ?? '',
      start_date: cycle?.start_date ?? today(),
      end_date: cycle?.end_date ?? '',
      status: cycle?.status ?? 'active',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: CycleFormValues) =>
      cycle
        ? nurseryManagementApi.updateCycle(cycle.id, values)
        : nurseryManagementApi.createCycle(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['nursery-management'] })
      onClose()
      form.reset()
    },
  })

  function submit(values: CycleFormValues) {
    mutation.mutate({
      ...values,
      source: values.source || null,
      pot_size: values.pot_size || null,
      end_date: values.end_date || null,
    })
  }

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-3xl">
      <form
        onSubmit={form.handleSubmit(submit)}
        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">
              {cycle ? 'تعديل دورة إنتاج' : 'إضافة دورة إنتاج'}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              الحقول مطابقة لنموذج إضافة دورة الإنتاج في النظام القديم.
            </p>
          </div>
          <Sprout className="h-6 w-6 text-[#c2410c]" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="اسم دورة الإنتاج" {...form.register('name')} error={form.formState.errors.name?.message} />
          <SelectField label="الحوض" {...form.register('basin_id')} error={form.formState.errors.basin_id?.message}>
            <option value={0}>اختر الحوض...</option>
            {options?.basins.map((basin) => (
              <option key={basin.id} value={basin.id}>
                {basin.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="نوع الشجرة" {...form.register('tree_type_id')} error={form.formState.errors.tree_type_id?.message}>
            <option value={0}>اختر نوع الشجرة...</option>
            {options?.varieties.map((variety) => (
              <option key={variety.id} value={variety.id}>
                {variety.name}
              </option>
            ))}
          </SelectField>
          <SelectField label="نوع التكاثر" {...form.register('propagation_type')}>
            <option value="seeds">بذور</option>
            <option value="cuttings">عقل</option>
            <option value="grafting">تطعيم</option>
            <option value="layering">ترقيد</option>
          </SelectField>
          <TextField label="مصدر العقل أو البذور" {...form.register('source')} />
          <TextField label="عدد البذور أو العقل" type="number" min={1} {...form.register('count')} error={form.formState.errors.count?.message} />
          <SelectField label="نوع المركن" {...form.register('pot_size')}>
            <option value="">بدون مركن</option>
            {options?.pot_sizes.map((pot) => (
              <option key={pot} value={pot}>
                {pot}
              </option>
            ))}
          </SelectField>
          <SelectField label="الحالة" {...form.register('status')}>
            <option value="active">نشطة</option>
            <option value="completed">مكتملة</option>
            <option value="cancelled">ملغاة</option>
          </SelectField>
          <TextField label="تاريخ البداية" type="date" {...form.register('start_date')} error={form.formState.errors.start_date?.message} />
          <TextField label="تاريخ النهاية المتوقع" type="date" {...form.register('end_date')} error={form.formState.errors.end_date?.message} />
        </div>

        {mutation.error ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {apiErrorMessage(mutation.error, 'تعذر حفظ دورة الإنتاج.')}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" tone="neutral" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            حفظ
          </Button>
        </div>
      </form>
    </AppDialog>
  )
}

function TransferDialog({
  open,
  cycle,
  options,
  onClose,
}: {
  open: boolean
  cycle: NurseryCycle | null
  options?: NurseryManageFilterOptions
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const form = useForm<TransferFormInput, unknown, TransferFormValues>({
    resolver: zodResolver(transferSchema),
    values: {
      cycle_id: cycle?.id ?? 0,
      successful_count: cycle?.count ?? 0,
      mark_remaining_failed: false,
      transfer_date: today(),
      lines: [
        {
          nursery_id: cycle?.nursery?.id ?? 0,
          location_id: cycle?.location?.id ?? 0,
          section_id: cycle?.section?.id ?? 0,
          basin_id: cycle?.basin_id ?? 0,
          line_number: 1,
          quantity: 1,
          pot_size: '',
          tree_height: 0.1,
        },
      ],
    },
  })
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' })
  const watchedLines = useWatch({ control: form.control, name: 'lines' }) ?? []
  const watchedSuccessful = Number(useWatch({ control: form.control, name: 'successful_count' }) ?? 0)
  const transferredTotal = watchedLines.reduce((sum, line) => sum + Number(line?.quantity || 0), 0)
  const remaining = watchedSuccessful - transferredTotal
  const germinationRate = cycle?.count ? (watchedSuccessful / cycle.count) * 100 : 0

  const mutation = useMutation({
    mutationFn: (values: TransferFormValues) =>
      nurseryManagementApi.createTransfer({
        ...values,
        transfer_date: values.transfer_date || null,
        lines: values.lines.map((line) => ({
          ...line,
          pot_size: line.pot_size || null,
          tree_height: line.tree_height || 0.1,
        })),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['nursery-management'] })
      onClose()
    },
  })

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-5xl">
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">نقل دورة الإنتاج</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {cycle?.name || '-'}، من أصل {formatNumber(cycle?.count)} شتلة.
            </p>
          </div>
          <Route className="h-6 w-6 text-emerald-600" />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <TextField label="عدد الشتلات الناجحة" type="number" min={0} max={cycle?.count ?? undefined} {...form.register('successful_count')} error={form.formState.errors.successful_count?.message} />
          <TextField label="تاريخ النقل" type="date" {...form.register('transfer_date')} />
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
            <div className="text-xs font-bold text-slate-500">نسبة الإنبات</div>
            <div className="mt-1 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {formatNumber(germinationRate, 2)}%
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
            <div className="text-xs font-bold text-slate-500">المتبقي للتوزيع</div>
            <div className="mt-1 font-mono text-lg font-bold text-[#c2410c] dark:text-orange-300">
              {formatNumber(remaining)}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {fields.map((field, index) => {
            const line = watchedLines[index]
            const locations = options?.locations.filter((item) => item.nursery_id === Number(line?.nursery_id)) ?? []
            const sections = options?.sections.filter((item) => item.location_id === Number(line?.location_id)) ?? []
            const basins: NurseryManageBasinOption[] = options?.basins.filter((item) => item.section_id === Number(line?.section_id)) ?? []

            return (
              <div key={field.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50">خط #{index + 1}</h3>
                  {fields.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="rounded-lg p-2 text-red-600 transition-all active:scale-[0.98]"
                      aria-label="حذف الخط"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <SelectField label="المشتل" {...form.register(`lines.${index}.nursery_id`)}>
                    <option value={0}>اختر المشتل...</option>
                    {options?.nurseries.map((nursery) => (
                      <option key={nursery.id} value={nursery.id}>
                        {nursery.name}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField label="الموقع" {...form.register(`lines.${index}.location_id`)}>
                    <option value={0}>اختر الموقع...</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField label="القسم" {...form.register(`lines.${index}.section_id`)}>
                    <option value={0}>اختر القسم...</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField label="الحوض" {...form.register(`lines.${index}.basin_id`)}>
                    <option value={0}>اختر الحوض...</option>
                    {basins.map((basin) => (
                      <option key={basin.id} value={basin.id}>
                        {basin.name}
                      </option>
                    ))}
                  </SelectField>
                  <TextField label="رقم الخط" type="number" min={1} {...form.register(`lines.${index}.line_number`)} />
                  <TextField label="الكمية" type="number" min={1} {...form.register(`lines.${index}.quantity`)} />
                  <SelectField label="مقاس المركن" {...form.register(`lines.${index}.pot_size`)}>
                    <option value="">بدون مركن</option>
                    {options?.pot_sizes.map((pot) => (
                      <option key={pot} value={pot}>
                        {pot}
                      </option>
                    ))}
                  </SelectField>
                  <TextField label="طول الشجرة (م)" type="number" min={0} step="0.01" {...form.register(`lines.${index}.tree_height`)} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...form.register('mark_remaining_failed')} />
            تحويل الكمية المتبقية إلى غير ناجح
          </label>
          <Button
            type="button"
            tone="neutral"
            onClick={() =>
              append({
                nursery_id: cycle?.nursery?.id ?? 0,
                location_id: cycle?.location?.id ?? 0,
                section_id: cycle?.section?.id ?? 0,
                basin_id: cycle?.basin_id ?? 0,
                line_number: fields.length + 1,
                quantity: 1,
                pot_size: '',
                tree_height: 0.1,
              })
            }
          >
            <Plus className="h-4 w-4" />
            إضافة خط جديد
          </Button>
        </div>

        {form.formState.errors.lines?.message ? (
          <p className="mt-3 text-xs font-bold text-red-600">{form.formState.errors.lines.message}</p>
        ) : null}
        {mutation.error ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {apiErrorMessage(mutation.error, 'تعذر حفظ النقل.')}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" tone="neutral" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" tone="green" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            تأكيد النقل
          </Button>
        </div>
      </form>
    </AppDialog>
  )
}

function ProcedureDialog({
  open,
  cycle,
  defaultType,
  onClose,
}: {
  open: boolean
  cycle: NurseryCycle | null
  defaultType: NurseryCycleProcedureType
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const form = useForm<ProcedureFormInput, unknown, ProcedureFormValues>({
    resolver: zodResolver(procedureSchema),
    values: {
      cycle_id: cycle?.id ?? 0,
      procedure_type: defaultType,
      procedure_date: today(),
      period: '',
      start_time: '',
      end_time: '',
      humidity_percentage: null,
      notes: '',
    },
  })
  const type = useWatch({ control: form.control, name: 'procedure_type' })
  const mutation = useMutation({
    mutationFn: (values: ProcedureFormValues) =>
      nurseryManagementApi.createProcedure({
        ...values,
        period: values.period || null,
        start_time: values.start_time || null,
        end_time: values.end_time || null,
        humidity_percentage: values.humidity_percentage ?? null,
        notes: values.notes || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['nursery-management'] })
      onClose()
    },
  })

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-2xl">
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">تسجيل إجراء دورة إنتاج</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{cycle?.name || '-'}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SelectField label="نوع الإجراء" {...form.register('procedure_type')}>
            <option value="irrigation">ري</option>
            <option value="inspection">كشف</option>
            <option value="humidity">رطوبة</option>
          </SelectField>
          <TextField label="تاريخ الإجراء" type="date" {...form.register('procedure_date')} />
          {type === 'irrigation' ? (
            <>
              <SelectField label="فترة الري" {...form.register('period')}>
                <option value="">اختر الفترة...</option>
                <option value="صباحية">صباحية</option>
                <option value="مسائية">مسائية</option>
              </SelectField>
              <div className="grid grid-cols-2 gap-3">
                <TextField label="من" type="time" {...form.register('start_time')} />
                <TextField label="إلى" type="time" {...form.register('end_time')} />
              </div>
            </>
          ) : null}
          {type === 'humidity' ? (
            <TextField label="نسبة الرطوبة (%)" type="number" min={0} max={100} step="0.01" {...form.register('humidity_percentage')} />
          ) : null}
          <TextField label="ملاحظات" {...form.register('notes')} />
        </div>

        {mutation.error ? (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {apiErrorMessage(mutation.error, 'تعذر حفظ الإجراء.')}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" tone="neutral" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            حفظ الإجراء
          </Button>
        </div>
      </form>
    </AppDialog>
  )
}

function LocationsDialog({
  size,
  onClose,
}: {
  size: NurseryManageVarietySize | null
  onClose: () => void
}) {
  const query = useQuery({
    queryKey: ['nursery-management-locations', size?.variety_id, size?.pot_size],
    enabled: Boolean(size?.variety_id && size?.pot_size),
    queryFn: () => nurseryManagementApi.locations(size!.variety_id, size!.pot_size || ''),
  })
  const rows: NurseryManageLocationRow[] = query.data?.data ?? []

  return (
    <AppDialog open={Boolean(size)} onClose={onClose} panelClassName="max-w-2xl">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-slate-50">تفاصيل المواقع</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {size?.variety_name}، مقاس {size?.pot_size || '-'}
            </p>
          </div>
          <Eye className="h-6 w-6 text-sky-600" />
        </div>

        {query.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" />
            ))}
          </div>
        ) : rows.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => (
              <div key={`${row.basin_id}-${row.quantity}`} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="text-sm font-bold text-slate-950 dark:text-slate-50">{row.basin_name}</div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    {row.nursery_name} / {row.location_name} / {row.section_name}
                  </div>
                </div>
                <span className="rounded-lg bg-emerald-50 px-3 py-1 font-mono text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {formatNumber(row.quantity)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-4 text-center text-sm font-bold text-slate-500 dark:bg-slate-900">
            لا توجد بيانات.
          </p>
        )}
      </div>
    </AppDialog>
  )
}

export default function NurseryManagePage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<NurseryManageFilters>({
    page: 1,
    per_page: 10,
    sort: 'created_at',
    direction: 'desc',
  })
  const [cycleDialog, setCycleDialog] = useState<{ open: boolean; cycle: NurseryCycle | null; basinId?: number }>({ open: false, cycle: null })
  const [transferCycle, setTransferCycle] = useState<NurseryCycle | null>(null)
  const [procedureState, setProcedureState] = useState<{ cycle: NurseryCycle | null; type: NurseryCycleProcedureType }>({ cycle: null, type: 'irrigation' })
  const [locationSize, setLocationSize] = useState<NurseryManageVarietySize | null>(null)
  const { data, isLoading, error, refetch, isFetching } = useNurseryManagement(filters)
  const payload = data?.data
  const varietySizes = useMemo(
    () => payload?.variety_stats.flatMap((variety) => variety.sizes) ?? [],
    [payload?.variety_stats]
  )
  const deleteMutation = useMutation({
    mutationFn: (cycle: NurseryCycle) => nurseryManagementApi.deleteCycle(cycle.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['nursery-management'] })
    },
  })

  return (
    <main dir="rtl" className="min-h-screen w-full bg-[#f8fafc] px-3 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-4 lg:px-6">
      <div className="w-full max-w-none space-y-6">
        <header className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-1 text-xs font-bold text-[#c2410c] dark:bg-orange-950/40 dark:text-orange-300">
                <Sprout className="h-4 w-4" />
                إدارة المشتل
              </div>
              <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50">إدارة المشتل</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                عرض هيكل المشتل بالكامل بطريقة تفاعلية.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" tone="neutral" onClick={() => refetch()}>
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              <a
                href="/nursery/locations"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#c2410c] px-4 py-2 text-sm font-bold text-white transition-all active:scale-[0.98] hover:bg-[#9a3412]"
              >
                <Layers3 className="h-4 w-4" />
                إدارة الهيكل
              </a>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {apiErrorMessage(error, 'تعذر تحميل بيانات إدارة المشتل.')}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-2xl bg-white dark:bg-slate-900" />
            ))}
          </div>
        ) : payload ? (
          <>
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-slate-50">
                <Activity className="h-5 w-5 text-[#c2410c]" />
                الإجماليات الكلية
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <SummaryTile label="مشاتل" value={formatNumber(payload.stats.nurseries)} icon={Warehouse} />
                <SummaryTile label="مواقع" value={formatNumber(payload.stats.locations)} icon={MapPin} />
                <SummaryTile label="أقسام" value={formatNumber(payload.stats.sections)} icon={Layers3} />
                <SummaryTile label="أحواض" value={formatNumber(payload.stats.basins)} icon={Layers3} />
                <SummaryTile label="مساحة الأحواض" value={formatNumber(payload.stats.basins_area, 2)} unit="م²" icon={Activity} />
                <SummaryTile label="إجمالي الأشجار" value={formatNumber(payload.stats.total_trees)} icon={Trees} tone="green" />
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-slate-50">
                  <Layers3 className="h-5 w-5 text-[#c2410c]" />
                  لوحة التحكم بالأحواض
                </h2>
              </div>
              <HierarchyPanel hierarchy={payload.hierarchy} />
            </section>

            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-slate-50">
                <Sprout className="h-5 w-5 text-[#c2410c]" />
                إحصائيات الأصناف حسب مقاس المركن
              </h2>
              <VarietyCards sizes={varietySizes} onShowLocations={setLocationSize} />
            </section>

            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-slate-50">
                <Layers3 className="h-5 w-5 text-[#c2410c]" />
                هيكل المشتل والأحواض
              </h2>
              <LegacyHierarchyList hierarchy={payload.hierarchy} />
            </section>
          </>
        ) : null}
      </div>

      <CycleDialog
        open={cycleDialog.open}
        cycle={cycleDialog.cycle}
        defaultBasinId={cycleDialog.basinId}
        options={payload?.filter_options}
        onClose={() => setCycleDialog({ open: false, cycle: null })}
      />
      <TransferDialog
        open={Boolean(transferCycle)}
        cycle={transferCycle}
        options={payload?.filter_options}
        onClose={() => setTransferCycle(null)}
      />
      <ProcedureDialog
        open={Boolean(procedureState.cycle)}
        cycle={procedureState.cycle}
        defaultType={procedureState.type}
        onClose={() => setProcedureState({ cycle: null, type: 'irrigation' })}
      />
      <LocationsDialog size={locationSize} onClose={() => setLocationSize(null)} />
    </main>
  )
}
