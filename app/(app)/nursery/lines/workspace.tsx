'use client'

import React, { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  ChevronLeft,
  Download,
  FileSpreadsheet,
  Filter,
  Home,
  Loader2,
  MapPin,
  Package,
  Printer,
  RotateCcw,
  Ruler,
  Search,
  Sprout,
  Table2,
} from 'lucide-react'
import { nurseryLinesApi, buildNurseryLineQuery } from '@/lib/api/nurseryLines'
import { useNurseryLineLedger } from '@/lib/hooks/useNurseryLines'
import type { ApiError } from '@/lib/types'
import type {
  NurseryLineBasinOption,
  NurseryLineLedgerFilters,
  NurseryLineLedgerRow,
  NurseryLineSectionOption,
} from '@/lib/types/nurseryLines'

const nullableNumber = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  })

const filtersSchema = z
  .object({
    nursery_id: nullableNumber,
    location_id: nullableNumber,
    section_id: nullableNumber,
    basin_id: nullableNumber,
    variety_id: nullableNumber,
    pot_size: z.string().nullable().optional().transform((value) => value || null),
    date_from: z.string().nullable().optional().transform((value) => value || null),
    date_to: z.string().nullable().optional().transform((value) => value || null),
  })
  .refine(
    (values) => !values.date_from || !values.date_to || values.date_to >= values.date_from,
    {
      path: ['date_to'],
      message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية أو مساويا له',
    }
  )

type FilterInput = z.input<typeof filtersSchema>
type FilterValues = z.output<typeof filtersSchema>

type InitialFilters = Record<keyof NurseryLineLedgerFilters, string | null>

function getErrorMessage(error: unknown) {
  const fallback = 'حدث خطأ أثناء تحميل بيانات الخطوط.'
  if (!error || typeof error !== 'object') return fallback

  const apiError = error as ApiError
  if (typeof apiError.message === 'string' && apiError.message.trim()) return apiError.message

  if (apiError.errors) {
    const firstFieldErrors = Object.values(apiError.errors)[0]
    if (firstFieldErrors?.[0]) return firstFieldErrors[0]
  }

  return fallback
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('ar-EG', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value)
}

function normalizeInitialFilters(filters: InitialFilters): FilterInput {
  return {
    nursery_id: filters.nursery_id,
    location_id: filters.location_id,
    section_id: filters.section_id,
    basin_id: filters.basin_id,
    variety_id: filters.variety_id,
    pot_size: filters.pot_size,
    date_from: filters.date_from,
    date_to: filters.date_to,
  }
}

function toLedgerFilters(values: FilterValues): NurseryLineLedgerFilters {
  return {
    nursery_id: values.nursery_id,
    location_id: values.location_id,
    section_id: values.section_id,
    basin_id: values.basin_id,
    variety_id: values.variety_id,
    pot_size: values.pot_size,
    date_from: values.date_from,
    date_to: values.date_to,
  }
}

function Button({
  children,
  tone = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'primary' | 'neutral' | 'green' }) {
  const toneClass = {
    primary: 'bg-terracotta text-white hover:bg-terracotta/90',
    neutral: 'border border-slate-100 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900',
    green: 'bg-emerald-600 text-white hover:bg-emerald-700',
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

function SelectField({
  label,
  children,
  error,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
      <select
        {...props}
        className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        {children}
      </select>
      {error ? <p className="mt-1 text-xs font-bold text-red-600">{error}</p> : null}
    </label>
  )
}

function DateField({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">{label}</span>
      <input
        {...props}
        type="date"
        className="min-h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      />
      {error ? <p className="mt-1 text-xs font-bold text-red-600">{error}</p> : null}
    </label>
  )
}

function SummaryTile({
  label,
  value,
  icon: Icon,
  unit,
}: {
  label: string
  value: string
  icon: typeof Table2
  unit?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-terracotta">
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

function SpecsCell({ line }: { line: NurseryLineLedgerRow }) {
  const specs = []
  if (line.height > 0) specs.push(`الطول: ${formatNumber(line.height, 2)}م`)
  if (line.thickness > 0) specs.push(`السماكة: ${formatNumber(line.thickness, 2)} بوصة`)

  return specs.length ? specs.join(' | ') : '-'
}

export default function NurseryLinesWorkspace({ initialFilters }: { initialFilters: InitialFilters }) {
  const router = useRouter()
  const [activeFilters, setActiveFilters] = useState<NurseryLineLedgerFilters>(() =>
    toLedgerFilters(filtersSchema.parse(normalizeInitialFilters(initialFilters)))
  )
  const { data, isLoading, error, refetch, isFetching } = useNurseryLineLedger(activeFilters)
  const payload = data?.data

  const form = useForm<FilterInput, unknown, FilterValues>({
    resolver: zodResolver(filtersSchema),
    defaultValues: normalizeInitialFilters(initialFilters),
  })

  const watchedNursery = Number(useWatch({ control: form.control, name: 'nursery_id' }) ?? 0)
  const watchedLocation = Number(useWatch({ control: form.control, name: 'location_id' }) ?? 0)
  const watchedSection = Number(useWatch({ control: form.control, name: 'section_id' }) ?? 0)

  const locations = useMemo(() => {
    const all = payload?.filter_options.locations ?? []
    return watchedNursery ? all.filter((location) => location.nursery_id === watchedNursery) : all
  }, [payload?.filter_options.locations, watchedNursery])

  const sections = useMemo<NurseryLineSectionOption[]>(() => {
    const all = payload?.filter_options.sections ?? []
    return watchedLocation ? all.filter((section) => section.location_id === watchedLocation) : all
  }, [payload?.filter_options.sections, watchedLocation])

  const basins = useMemo<NurseryLineBasinOption[]>(() => {
    const all = payload?.filter_options.basins ?? []
    return watchedSection ? all.filter((basin) => basin.section_id === watchedSection) : all
  }, [payload?.filter_options.basins, watchedSection])

  function applyFilters(values: FilterValues) {
    const nextFilters = toLedgerFilters(values)
    setActiveFilters(nextFilters)
    const query = buildNurseryLineQuery(nextFilters)
    router.replace(`/nursery/lines${query ? `?${query}` : ''}`)
  }

  function resetFilters() {
    const nextValues: FilterInput = {
      nursery_id: null,
      location_id: null,
      section_id: null,
      basin_id: null,
      variety_id: null,
      pot_size: null,
      date_from: null,
      date_to: null,
    }
    form.reset(nextValues)
    setActiveFilters({})
    router.replace('/nursery/lines')
  }

  async function downloadCsv() {
    const response = await nurseryLinesApi.exportCsv(activeFilters)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `tree_lines_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6" dir="rtl">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 text-xs font-bold text-slate-500">المشتل / عرض الخطوط</div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50">عرض الخطوط</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            دفتر خطوط الشتلات النشطة حسب المشتل والموقع والقسم والحوض والصنف ومقاس المركن وتاريخ الميلاد.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" tone="neutral" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
          <Button type="button" tone="green" onClick={downloadCsv} disabled={isLoading || isFetching}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button type="button" tone="neutral" onClick={() => router.push('/nursery')}>
            <Home className="h-4 w-4" />
            الرئيسية
          </Button>
        </div>
      </header>

      {payload ? (
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryTile label="عدد الخطوط" value={formatNumber(payload.summary.lines_count)} icon={Table2} />
          <SummaryTile label="إجمالي الشتلات" value={formatNumber(payload.summary.total_quantity)} icon={Sprout} unit="شتلة" />
          <SummaryTile label="مقاسات المراكن المتاحة" value={formatNumber(payload.filter_options.pot_sizes.length)} icon={Package} />
        </div>
      ) : null}

      <form
        onSubmit={form.handleSubmit(applyFilters)}
        className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
        noValidate
      >
        <div className="mb-4 flex items-center gap-2 text-base font-bold text-slate-950 dark:text-slate-50">
          <Filter className="h-5 w-5 text-terracotta" />
          الفلاتر
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SelectField
            label="المشتل"
            {...form.register('nursery_id')}
            onChange={(event) => {
              form.setValue('nursery_id', event.target.value)
              form.setValue('location_id', null)
              form.setValue('section_id', null)
              form.setValue('basin_id', null)
            }}
          >
            <option value="">الكل</option>
            {payload?.filter_options.nurseries.map((nursery) => (
              <option key={nursery.id} value={nursery.id}>
                {nursery.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="الموقع"
            {...form.register('location_id')}
            onChange={(event) => {
              form.setValue('location_id', event.target.value)
              form.setValue('section_id', null)
              form.setValue('basin_id', null)
            }}
          >
            <option value="">الكل</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="القسم"
            {...form.register('section_id')}
            onChange={(event) => {
              form.setValue('section_id', event.target.value)
              form.setValue('basin_id', null)
            }}
          >
            <option value="">الكل</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </SelectField>

          <SelectField label="الحوض" {...form.register('basin_id')}>
            <option value="">الكل</option>
            {basins.map((basin) => (
              <option key={basin.id} value={basin.id}>
                {basin.name}
              </option>
            ))}
          </SelectField>

          <SelectField label="نوع الشجرة" {...form.register('variety_id')}>
            <option value="">الكل</option>
            {payload?.filter_options.varieties.map((variety) => (
              <option key={variety.id} value={variety.id}>
                {variety.name}
              </option>
            ))}
          </SelectField>

          <SelectField label="مقاس المركن" {...form.register('pot_size')}>
            <option value="">الكل</option>
            {payload?.filter_options.pot_sizes.map((potSize) => (
              <option key={potSize} value={potSize}>
                {potSize}
              </option>
            ))}
          </SelectField>

          <DateField label="تاريخ الميلاد (من)" {...form.register('date_from')} />
          <DateField label="تاريخ الميلاد (إلى)" error={form.formState.errors.date_to?.message} {...form.register('date_to')} />
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" tone="neutral" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4" />
            إعادة ضبط
          </Button>
          <Button type="submit">
            <CalendarDays className="h-4 w-4" />
            تطبيق التاريخ
          </Button>
          <Button type="button" tone="neutral" onClick={() => refetch()}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            تحديث
          </Button>
        </div>
      </form>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {getErrorMessage(error)}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-right text-xs font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                <th className="px-4 py-3">الخط</th>
                <th className="px-4 py-3">نوع الشجرة</th>
                <th className="px-4 py-3">الكمية</th>
                <th className="px-4 py-3">المقاس</th>
                <th className="px-4 py-3">المواصفات</th>
                <th className="px-4 py-3">الموقع</th>
                <th className="px-4 py-3">تاريخ الميلاد</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-t border-slate-100 dark:border-slate-800">
                    {Array.from({ length: 7 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-4">
                        <div className="h-5 animate-skeleton-shimmer rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payload?.lines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm font-bold text-slate-500">
                    لا توجد نتائج مطابقة للبحث
                  </td>
                </tr>
              ) : (
                payload?.lines.map((line) => (
                  <tr key={line.id} className="border-t border-slate-100 text-sm text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900">
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                        خط {formatNumber(line.line_number)}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-950 dark:text-slate-50">{line.variety_name}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {formatNumber(line.quantity)}
                      </span>
                    </td>
                    <td className="px-4 py-4">{line.pot_size || '-'}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-slate-400" />
                        <SpecsCell line={line} />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-[320px] flex-wrap items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <MapPin className="h-4 w-4 text-terracotta" />
                        <span>{line.nursery.name}</span>
                        <ChevronLeft className="h-3 w-3" />
                        <span>{line.location.name}</span>
                        <ChevronLeft className="h-3 w-3" />
                        <span>{line.section.name}</span>
                        <ChevronLeft className="h-3 w-3" />
                        <span className="text-slate-950 dark:text-slate-50">{line.basin.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">{line.birth_date || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
