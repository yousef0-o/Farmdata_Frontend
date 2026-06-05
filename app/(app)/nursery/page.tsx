'use client'

import React, { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  ChartColumn,
  ChartPie,
  ChevronDown,
  CircleDollarSign,
  Grid3X3,
  Landmark,
  Layers3,
  MapPin,
  ReceiptText,
  Ruler,
  Search,
  Sprout,
  Trees,
  Warehouse,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import AppDialog from '@/components/ui/AppDialog'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'
import { Skeleton } from '@/components/ui/Skeleton'
import { useNurseryManagement } from '@/lib/hooks/useNurseryManagement'
import { useNurseryInventoryBootstrap, useNurseryInventoryValuation } from '@/lib/hooks/useNurseryInventory'
import { useNurseryExpensesBootstrap } from '@/lib/hooks/useNurseryExpenses'
import { useNurseryInvoices } from '@/lib/hooks/useNurseryInvoices'
import type { NurseryCycle } from '@/lib/types/nurseryManagement'
import type { NurseryInventoryCategoryTotal, NurseryInventoryItem } from '@/lib/types/nurseryInventory'
import type { NurseryAssetGroup, NurseryPinnedExpenseAccount } from '@/lib/types/nurseryExpenses'

const PotSizeChart = dynamic(() => import('./_components/PotSizeChart'), {
  ssr: false,
  loading: () => <div className="h-[320px] rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 animate-pulse border border-slate-100 dark:border-slate-800" />,
})
const SpeciesDonutChart = dynamic(() => import('./_components/SpeciesDonutChart'), {
  ssr: false,
  loading: () => <div className="h-[320px] rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 animate-pulse border border-slate-100 dark:border-slate-800" />,
})
const AssetsPieChart = dynamic(() => import('./_components/AssetsPieChart'), {
  ssr: false,
  loading: () => <div className="h-[320px] rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 animate-pulse border border-slate-100 dark:border-slate-800" />,
})
const ExpensesBarChart = dynamic(() => import('./_components/ExpensesBarChart'), {
  ssr: false,
  loading: () => <div className="h-[320px] rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 animate-pulse border border-slate-100 dark:border-slate-800" />,
})

type MetricTile = {
  id: string
  label: string
  value: string
  unit?: React.ReactNode
  icon: LucideIcon
  tone: 'emerald' | 'blue' | 'orange' | 'purple' | 'amber' | 'slate'
}

type CapacityOverview = {
  total: number
  totalDisplay: string
  planted: number
  plantedDisplay: string
  utilizationDisplay: string
}

type ChartDatum = {
  label: string
  value: number
  valueDisplay: string
  color: string
}

type StructureMetric = {
  id: string
  label: string
  value: string
  dotClassName: string
}

type LowStockItem = {
  id: string
  name: string
  unit: string
  currentQuantity: number
  minQuantity: number
}

type BasinOption = {
  id: string
  name: string
}

type SectionOption = {
  id: string
  name: string
  basins: BasinOption[]
}

type LocationOption = {
  id: string
  name: string
  sections: SectionOption[]
}

type NurseryOption = {
  id: string
  name: string
  locations: LocationOption[]
}

type NurserySelection = {
  nurseryId: string
  locationId: string
  sectionId: string
  basinId: string
}

const toneClasses: Record<MetricTile['tone'], string> = {
  emerald: 'bg-emerald-50 text-[#10b981] border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  blue: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-455/80 dark:text-blue-400 dark:border-blue-900/30',
  orange: 'bg-orange-50 text-terracotta border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30',
  purple: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
  amber: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  slate: 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/30',
}

const selectBaseClassName =
  'h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white dark:bg-surface px-4 pl-10 text-sm font-semibold text-slate-800 outline-none transition-all duration-200 hover:border-slate-300 focus:border-[#10b981] focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`
}

function MetricCard({ metric }: { metric: MetricTile }) {
  const Icon = metric.icon

  return (
    <article className="flex min-h-32 items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white dark:bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md">
      <div className="min-w-0 text-right">
        <p className="text-xs font-bold leading-5 text-slate-500">
          {metric.label}
        </p>
        <div className="mt-3 flex flex-wrap items-baseline justify-start gap-2">
          <span className="font-mono text-2xl font-extrabold leading-none text-slate-900">
            {metric.value}
          </span>
          {metric.unit ? (
            <span className="text-sm font-bold text-slate-500">
              {metric.unit}
            </span>
          ) : null}
        </div>
      </div>

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${toneClasses[metric.tone]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
    </article>
  )
}

function ProgressRow({
  label,
  value,
  percent,
  toneClassName,
}: {
  label: string
  value: string
  percent: number
  toneClassName: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-xs font-extrabold">
        <span className="text-slate-700">{label}</span>
        <span className="font-mono text-slate-900">{value}</span>
      </div>
      <div className="h-3.5 overflow-hidden rounded-full bg-slate-100 p-0.5 ring-1 ring-inset ring-slate-200/50 dark:bg-slate-800 dark:ring-slate-700/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${toneClassName}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  )
}

function CapacityCard({ capacity }: { capacity: CapacityOverview }) {
  const utilization = capacity.total > 0 ? (capacity.planted / capacity.total) * 100 : 0

  return (
    <section className="rounded-2xl border border-slate-100 bg-white dark:bg-surface p-5 shadow-sm sm:p-6">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#10b981] ring-1 ring-emerald-100 dark:bg-emerald-950/20 dark:ring-emerald-900/30">
            <ChartPie className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-extrabold text-slate-900">
            مقارنة السعة والزراعة
          </h2>
        </div>
        <span className="w-fit rounded-xl bg-emerald-50 px-3 py-2 text-sm font-extrabold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-900/30">
          نسبة التشغيل: {capacity.utilizationDisplay}
        </span>
      </div>

      <div className="space-y-6">
        <ProgressRow
          label={`الطاقة الاستيعابية (${capacity.totalDisplay})`}
          value={capacity.totalDisplay}
          percent={100}
          toneClassName="bg-emerald-500"
        />
        <ProgressRow
          label={`الأشجار القائمة (${capacity.plantedDisplay})`}
          value={formatPercent(utilization)}
          percent={utilization}
          toneClassName="bg-terracotta"
        />
      </div>
    </section>
  )
}



function ChartsCard({
  potDistribution,
  speciesDistribution,
}: {
  potDistribution: ChartDatum[]
  speciesDistribution: ChartDatum[]
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white dark:bg-surface p-5 shadow-sm sm:p-6">
      <div className="grid gap-5 xl:grid-cols-2">
        <PotSizeChart data={potDistribution} />
        <SpeciesDonutChart data={speciesDistribution} />
      </div>
    </section>
  )
}



function FinancialChartsCard({
  groupedAssets,
  pinnedAccounts,
}: {
  groupedAssets: NurseryAssetGroup[]
  pinnedAccounts: NurseryPinnedExpenseAccount[]
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white dark:bg-surface p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-950/20 dark:ring-blue-900/30">
            <Landmark className="h-5 w-5" />
          </span>
          <div className="text-right">
            <h2 className="text-lg font-extrabold text-slate-900">
              التحليلات المالية للأصول والمصروفات
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              رسم بياني لتوزيع قيم الأصول الثابتة والمصروفات الجارية
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AssetsPieChart groupedAssets={groupedAssets} />
        <ExpensesBarChart pinnedAccounts={pinnedAccounts} />
      </div>
    </section>
  )
}

function ActiveCyclesCard({ cycles }: { cycles: NurseryCycle[] }) {
  const propagationLabels: Record<string, string> = {
    seeds: 'بذور',
    cuttings: 'عقل',
    grafting: 'تطعيم',
    layering: 'ترقيد',
  }

  const statusLabels: Record<string, string> = {
    active: 'نشط',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white dark:bg-surface p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#10b981] ring-1 ring-emerald-100 dark:bg-emerald-950/20 dark:ring-emerald-900/30">
            <Sprout className="h-5 w-5" />
          </span>
          <div className="text-right">
            <h2 className="text-lg font-extrabold text-slate-900">
              دورات الإنتاج النشطة بالمشتل
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              متابعة كميات وتواريخ وعمليات الإنتاج الجارية
            </p>
          </div>
        </div>
        <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
          إجمالي الدورات: {cycles.length.toLocaleString('ar-SA')}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full min-w-[700px] border-collapse text-right text-sm">
          <thead>
            <tr className="bg-slate-50/70 text-slate-600">
              <th className="p-4 font-extrabold">اسم الدورة</th>
              <th className="p-4 font-extrabold">النوع / الصنف</th>
              <th className="p-4 font-extrabold text-center">الكمية القائمة</th>
              <th className="p-4 font-extrabold">طريقة الإكثار</th>
              <th className="p-4 font-extrabold">الموقع / الحوض</th>
              <th className="p-4 font-extrabold">تاريخ البدء</th>
              <th className="p-4 font-extrabold text-center">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cycles.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center font-semibold text-slate-400">
                  لا توجد دورات إنتاج نشطة حالياً.
                </td>
              </tr>
            ) : (
              cycles.map((cycle) => (
                <tr
                  key={cycle.id}
                  className="transition-colors duration-150 hover:bg-slate-50/50"
                >
                  <td className="p-4 font-extrabold text-slate-900">
                    {cycle.name}
                  </td>
                  <td className="p-4 font-semibold text-slate-600">
                    {cycle.variety_name || 'غير محدد'}
                  </td>
                  <td className="p-4 text-center font-mono font-extrabold text-slate-900">
                    {cycle.count.toLocaleString('ar-SA')}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
                      {cycle.propagation_type ? propagationLabels[cycle.propagation_type] : 'غير محدد'}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-semibold text-slate-500">
                    {cycle.nursery?.name || ''} - {cycle.basin?.name || 'غير محدد'}
                  </td>
                  <td className="p-4 font-mono text-xs font-semibold text-slate-500">
                    {cycle.start_date || 'غير محدد'}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex rounded-lg px-2 py-1 text-xs font-extrabold ${
                      cycle.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {statusLabels[cycle.status] || cycle.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StructureCard({ structure }: { structure: StructureMetric[] }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white dark:bg-surface p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-100">
          <Warehouse className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-extrabold text-slate-900">
          هيكل المشتل
        </h2>
      </div>

      <div className="divide-y divide-slate-100">
        {structure.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${item.dotClassName}`} />
              <span className="text-sm font-bold text-slate-600">
                {item.label}
              </span>
            </div>
            <span className="font-mono text-base font-extrabold text-slate-900">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function InventoryCategoriesCard({ categories }: { categories: NurseryInventoryCategoryTotal[] }) {
  return (
    <section className="flex flex-col flex-1 rounded-2xl border border-slate-100 bg-white dark:bg-surface p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-100">
          <Boxes className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-extrabold text-slate-900">
          فئات مخزون المشتل
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
        {categories.length === 0 ? (
          <div className="text-center py-6 text-sm font-semibold text-slate-400">
            لا توجد فئات مخزون.
          </div>
        ) : (
          categories.map((cat, index) => {
            const colors = [
              'border-r-[#10b981]',
              'border-r-blue-500',
              'border-r-terracotta',
              'border-r-purple-500',
              'border-r-amber-500',
            ]
            const borderCol = colors[index % colors.length]
            return (
              <div
                key={cat.category_id || index}
                className={`flex items-center justify-between gap-4 border-r-4 ${borderCol} bg-slate-50/50 px-3.5 py-3 rounded-l-xl transition-all duration-200 hover:bg-slate-100`}
              >
                <div className="text-right">
                  <p className="text-sm font-extrabold text-slate-800">
                    {cat.category_name}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-400">
                    عدد المواد: {cat.items_count.toLocaleString('ar-SA')}
                  </p>
                </div>
                <div className="text-left font-mono text-sm font-extrabold text-slate-900 flex items-center gap-0.5">
                  <span>{cat.total_value.toLocaleString('ar-SA')}</span>
                  <SaudiRiyalIcon size={12} className="text-emerald-700 mr-0.5" />
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

function NurseryInventoryCard({
  items,
  showDetails,
  onToggleDetails,
}: {
  items: LowStockItem[]
  showDetails: boolean
  onToggleDetails: () => void
}) {
  return (
    <section className="flex flex-col flex-1 rounded-2xl border border-slate-100 bg-white dark:bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-950/20 dark:ring-amber-900/30">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="text-right">
            <h2 className="text-lg font-extrabold text-slate-900">
              مخزون المشتل
            </h2>
            <p className="mt-1 text-xs font-bold text-amber-700">
              مخزون منخفض
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleDetails}
          className="rounded-lg px-2 py-1 text-sm font-extrabold text-[#10b981] transition-all duration-200 hover:bg-emerald-50 active:scale-[0.98]"
        >
          عرض الكل
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
        {items.length === 0 ? (
          <div className="text-center py-6 text-sm font-semibold text-slate-400">
            المخزون سليم بالكامل.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-950/20"
            >
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-extrabold text-slate-800">
                  {item.name}
                </p>
                {showDetails ? (
                  <p className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    الحد الأدنى: {item.minQuantity} {item.unit}
                  </p>
                ) : null}
              </div>
              <div className="text-left">
                <span className="block font-mono text-xl font-extrabold text-amber-700 dark:text-amber-400">
                  {item.currentQuantity}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {item.unit}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function SelectField({
  label,
  icon: Icon,
  value,
  disabled,
  placeholder,
  options,
  onChange,
}: {
  label: string
  icon: LucideIcon
  value: string
  disabled?: boolean
  placeholder: string
  options: { id: string; name: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-700 dark:text-slate-200">
        <Icon className="h-4 w-4 text-slate-400" />
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={selectBaseClassName}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </span>
    </label>
  )
}

function QuickAccessModal({
  open,
  onClose,
  nurseries,
}: {
  open: boolean
  onClose: () => void
  nurseries: NurseryOption[]
}) {
  const router = useRouter()
  const [selection, setSelection] = useState<NurserySelection>({
    nurseryId: '',
    locationId: '',
    sectionId: '',
    basinId: '',
  })

  const selectedNursery = useMemo(
    () => nurseries.find((nursery) => nursery.id === selection.nurseryId),
    [nurseries, selection.nurseryId]
  )
  const selectedLocation = useMemo(
    () => selectedNursery?.locations.find((location) => location.id === selection.locationId),
    [selectedNursery, selection.locationId]
  )
  const selectedSection = useMemo(
    () => selectedLocation?.sections.find((section) => section.id === selection.sectionId),
    [selectedLocation, selection.sectionId]
  )

  const isPathComplete = Boolean(
    selection.nurseryId && selection.locationId && selection.sectionId && selection.basinId
  )

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      labelledBy="quick-access-title"
      describedBy="quick-access-description"
      panelClassName="max-w-xl"
    >
      <div className="max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-100 bg-white dark:bg-surface p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق الوصول السريع"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:rotate-90 hover:bg-red-50 hover:text-red-500 active:scale-[0.98]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#10b981] ring-1 ring-emerald-100 dark:bg-emerald-950/20 dark:ring-emerald-900/30">
            <Grid3X3 className="h-7 w-7" />
          </div>
          <h2 id="quick-access-title" className="text-xl font-extrabold text-slate-900">
            الوصول السريع للأحواض
          </h2>
          <p id="quick-access-description" className="mt-2 text-sm font-semibold text-slate-500">
            اختر المشتل ثم الموقع والقسم والحوض للوصول إلى مسار الإدارة.
          </p>
        </div>

        <div className="space-y-4">
          <SelectField
            label="1. المشتل"
            icon={Warehouse}
            value={selection.nurseryId}
            placeholder="اختر المشتل..."
            options={nurseries}
            onChange={(nurseryId) =>
              setSelection({
                nurseryId,
                locationId: '',
                sectionId: '',
                basinId: '',
              })
            }
          />
          <SelectField
            label="2. الموقع"
            icon={MapPin}
            value={selection.locationId}
            disabled={!selectedNursery}
            placeholder="اختر الموقع..."
            options={selectedNursery?.locations ?? []}
            onChange={(locationId) =>
              setSelection((current) => ({
                ...current,
                locationId,
                sectionId: '',
                basinId: '',
              }))
            }
          />
          <SelectField
            label="3. القسم"
            icon={Layers3}
            value={selection.sectionId}
            disabled={!selectedLocation}
            placeholder="اختر القسم..."
            options={selectedLocation?.sections ?? []}
            onChange={(sectionId) =>
              setSelection((current) => ({
                ...current,
                sectionId,
                basinId: '',
              }))
            }
          />
          <SelectField
            label="4. الحوض"
            icon={Sprout}
            value={selection.basinId}
            disabled={!selectedSection}
            placeholder="اختر الحوض..."
            options={selectedSection?.basins ?? []}
            onChange={(basinId) =>
              setSelection((current) => ({
                ...current,
                basinId,
              }))
            }
          />
        </div>

        <button
          type="button"
          disabled={!isPathComplete}
          onClick={() => {
            if (isPathComplete) {
              router.push(`/nursery/manage/basins/${selection.basinId}`)
              onClose()
            }
          }}
          className={`mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold transition-all duration-200 active:scale-[0.98] ${
            isPathComplete
              ? 'bg-[#10b981] text-white shadow-[0_12px_28px_rgba(16,185,129,0.24)] hover:bg-emerald-600'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          انتقل لإدارة الحوض
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>
    </AppDialog>
  )
}

export default function NurseryPage() {
  const [quickAccessOpen, setQuickAccessOpen] = useState(false)
  const [showLowStockDetails, setShowLowStockDetails] = useState(false)
  const [mounted, setMounted] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Real live backend integration hooks
  const { data: nurseryManageRes, isLoading: isNurseryLoading } = useNurseryManagement({})
  const { data: inventoryValuationRes, isLoading: isValuationLoading } = useNurseryInventoryValuation()
  const { data: expensesBootstrapRes, isLoading: isExpensesLoading } = useNurseryExpensesBootstrap()
  const { data: invoicesRes, isLoading: isInvoicesLoading } = useNurseryInvoices('sale')
  const { data: inventoryBootstrapRes, isLoading: isInventoryLoading } = useNurseryInventoryBootstrap()

  const isLoading =
    !mounted ||
    isNurseryLoading ||
    isValuationLoading ||
    isExpensesLoading ||
    isInvoicesLoading ||
    isInventoryLoading

  // Unpack dynamic counts safely
  const stats = nurseryManageRes?.data?.stats
  const varietyStats = nurseryManageRes?.data?.variety_stats
  const hierarchy = nurseryManageRes?.data?.hierarchy
  const cycles = nurseryManageRes?.data?.cycles || []

  const totalTrees = stats?.total_trees ?? 0
  const activePonds = stats?.basins ?? 0
  const nurseriesCount = stats?.nurseries ?? 0
  const locationsCount = stats?.locations ?? 0
  const sectionsCount = stats?.sections ?? 0
  const totalArea = stats?.basins_area ?? 0

  // Calculate dynamic capacity from basin hierarchy
  const totalCapacity = useMemo(() => {
    if (!hierarchy) return 0
    let sum = 0
    hierarchy.forEach((n) => {
      n.locations?.forEach((l) => {
        l.sections?.forEach((s) => {
          s.basins?.forEach((b) => {
            sum += b.capacity || 0
          })
        })
      })
    })
    return sum
  }, [hierarchy])

  // Unpack financial details safely
  const inventoryValue = inventoryValuationRes?.data?.grand_total_value ?? 0
  const assetValue = expensesBootstrapRes?.data?.summary?.assets_total ?? 0
  const totalExpenses = expensesBootstrapRes?.data?.summary?.expenses_total ?? 0
  const salesRevenue = invoicesRes?.data?.summary?.total ?? 0
  const categoryTotals = inventoryValuationRes?.data?.category_totals || []
  const groupedAssets = expensesBootstrapRes?.data?.grouped_assets || []
  const pinnedAccounts = expensesBootstrapRes?.data?.pinned_accounts || []

  // Assemble Dynamic Metrics
  const metrics: MetricTile[] = useMemo(() => {
    return [
      {
        id: 'total-trees',
        label: 'إجمالي الأشجار القائمة',
        value: totalTrees.toLocaleString('ar-SA'),
        icon: Trees,
        tone: 'emerald',
      },
      {
        id: 'total-capacity',
        label: 'الطاقة الاستيعابية القصوى',
        value: totalCapacity.toLocaleString('ar-SA'),
        icon: Ruler,
        tone: 'blue',
      },
      {
        id: 'inventory-value',
        label: 'قيمة المخزون الإجمالية',
        value: inventoryValue.toLocaleString('ar-SA'),
        unit: <SaudiRiyalIcon size={16} className="text-emerald-700" />,
        icon: Boxes,
        tone: 'slate',
      },
      {
        id: 'asset-value',
        label: 'قيمة الأصول الثابتة',
        value: assetValue.toLocaleString('ar-SA'),
        unit: <SaudiRiyalIcon size={16} className="text-emerald-700" />,
        icon: Landmark,
        tone: 'purple',
      },
      {
        id: 'total-expenses',
        label: 'إجمالي المصروفات التشغيلية',
        value: totalExpenses.toLocaleString('ar-SA'),
        unit: <SaudiRiyalIcon size={16} className="text-emerald-700" />,
        icon: CircleDollarSign,
        tone: 'orange',
      },
      {
        id: 'sales-revenue',
        label: 'إجمالي إيرادات المبيعات',
        value: salesRevenue.toLocaleString('ar-SA'),
        unit: <SaudiRiyalIcon size={16} className="text-emerald-700" />,
        icon: ReceiptText,
        tone: 'amber',
      },
    ]
  }, [totalTrees, totalCapacity, inventoryValue, assetValue, totalExpenses, salesRevenue])

  // Assemble Capacity Details
  const capacity: CapacityOverview = useMemo(() => {
    const rate = totalCapacity > 0 ? (totalTrees / totalCapacity) * 100 : 0
    return {
      total: totalCapacity,
      totalDisplay: totalCapacity.toLocaleString('ar-SA'),
      planted: totalTrees,
      plantedDisplay: totalTrees.toLocaleString('ar-SA'),
      utilizationDisplay: `${rate.toFixed(2)}%`,
    }
  }, [totalCapacity, totalTrees])

  // Assemble Pot Size Bar Chart Distribution
  const potDistribution = useMemo(() => {
    if (!varietyStats) return []
    const map: Record<string, number> = {}
    varietyStats.forEach((v) => {
      v.sizes?.forEach((s) => {
        const sizeLabel = s.pot_size || 'غير محدد'
        map[sizeLabel] = (map[sizeLabel] || 0) + s.total_quantity
      })
    })

    const colors = ['#c2410c', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#64748b']
    return Object.entries(map)
      .map(([label, value], index) => ({
        label,
        value,
        valueDisplay: value.toLocaleString('ar-SA'),
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value)
  }, [varietyStats])

  // Assemble Donut Chart Variety/Species Distribution
  const speciesDistribution = useMemo(() => {
    if (!varietyStats) return []
    const colors = ['#10b981', '#c2410c', '#3b82f6', '#8b5cf6', '#f59e0b', '#64748b']
    return varietyStats
      .map((item, index) => ({
        label: item.variety_name || 'غير محدد',
        value: item.total_quantity,
        valueDisplay: item.total_quantity.toLocaleString('ar-SA'),
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value)
  }, [varietyStats])

  // Assemble Structure Metrics
  const structure = useMemo(() => {
    return [
      {
        id: 'nurseries',
        label: 'المشاتل',
        value: nurseriesCount.toLocaleString('ar-SA'),
        dotClassName: 'bg-[#10b981]',
      },
      {
        id: 'locations',
        label: 'المواقع الفرعية',
        value: locationsCount.toLocaleString('ar-SA'),
        dotClassName: 'bg-blue-500',
      },
      {
        id: 'sections',
        label: 'الأقسام الرئيسية',
        value: sectionsCount.toLocaleString('ar-SA'),
        dotClassName: 'bg-terracotta',
      },
      {
        id: 'basins',
        label: 'الأحواض النشطة',
        value: activePonds.toLocaleString('ar-SA'),
        dotClassName: 'bg-purple-500',
      },
      {
        id: 'area',
        label: 'المساحة الكلية للمشاتل',
        value: `${totalArea.toLocaleString('ar-SA')} م²`,
        dotClassName: 'bg-amber-500',
      },
    ]
  }, [nurseriesCount, locationsCount, sectionsCount, activePonds, totalArea])

  // Assemble Low Stock Details from Dynamic Balances
  const lowStock = useMemo(() => {
    if (!inventoryBootstrapRes?.data?.items) return []
    return inventoryBootstrapRes.data.items
      .filter((item: NurseryInventoryItem) => item.low_stock)
      .map((item: NurseryInventoryItem) => ({
        id: String(item.id),
        name: item.name,
        unit: item.unit || 'وحدة',
        currentQuantity: item.quantity,
        minQuantity: item.min_quantity,
      }))
  }, [inventoryBootstrapRes])

  // Assemble Quick Access hierarchy
  const mappedQuickAccess = useMemo(() => {
    if (!hierarchy) return []
    return hierarchy.map((n) => ({
      id: String(n.id),
      name: n.name,
      locations:
        n.locations?.map((l) => ({
          id: String(l.id),
          name: l.name,
          sections:
            l.sections?.map((s) => ({
              id: String(s.id),
              name: s.name,
              basins:
                s.basins?.map((b) => ({
                  id: String(b.id),
                  name: b.name,
                })) || [],
            })) || [],
        })) || [],
    }))
  }, [hierarchy])

  // Skeletons during data fetching
  if (isLoading) {
    return (
      <div className="min-h-full space-y-6 bg-background p-6 text-slate-900" dir="rtl">
        {/* Header Skeleton */}
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white dark:bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2 text-right">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl" />
        </header>

        {/* Metrics Grid Skeleton */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex min-h-32 items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white dark:bg-surface p-5 shadow-sm">
              <div className="space-y-3 min-w-0 text-right w-full">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-20" />
              </div>
              <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
            </div>
          ))}
        </section>

        {/* Charts & Details Skeleton */}
        <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
          <div className="space-y-6">
            {/* Capacity Card Skeleton */}
            <div className="rounded-2xl border border-slate-100 bg-white dark:bg-surface p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-28 rounded-xl" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-full rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-full rounded-full" />
                </div>
              </div>
            </div>

            {/* Charts Skeleton */}
            <div className="rounded-2xl border border-slate-100 bg-white dark:bg-surface p-6 shadow-sm">
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="h-[320px] rounded-2xl border border-slate-100 bg-slate-50/60 p-5 space-y-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-40 w-full rounded-xl" />
                </div>
                <div className="h-[320px] rounded-2xl border border-slate-100 bg-slate-50/60 p-5 space-y-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-40 w-full rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Structure Card Skeleton */}
            <div className="rounded-2xl border border-slate-100 bg-white dark:bg-surface p-5 shadow-sm space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between py-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full space-y-6 bg-background p-6 text-slate-900" dir="rtl">
      {/* Banner / Header */}
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white dark:bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-right">
          <h1 className="text-2xl font-extrabold tracking-normal text-slate-900">
            نظام إدارة المشتل
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            لوحة التحكم الرئيسية وإحصائيات المشتل
          </p>
        </div>

        <button
          type="button"
          onClick={() => setQuickAccessOpen((open) => !open)}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#10b981] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(16,185,129,0.22)] transition-all duration-200 hover:bg-emerald-600 hover:shadow-[0_16px_34px_rgba(16,185,129,0.28)] active:scale-[0.98]"
        >
          <Search className="h-5 w-5" />
          الوصول السريع للأحواض
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      {/* Group A Layout: Capacity, Species/Pot Charts, Structure and Categories */}
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr] items-stretch">
        <div className="flex flex-col space-y-6">
          <CapacityCard capacity={capacity} />
          
          {/* Main Visual Species & Pot Size Charts */}
          <ChartsCard
            potDistribution={potDistribution}
            speciesDistribution={speciesDistribution}
          />
        </div>

        <aside className="flex flex-col space-y-6 h-full">
          <StructureCard structure={structure} />
          {/* Core Inventory Categories Valuation Card */}
          <InventoryCategoriesCard categories={categoryTotals} />
        </aside>
      </div>

      {/* Group B Layout: Financial Analytics, Active Cycles and Alerts */}
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr] items-stretch">
        <div className="flex flex-col space-y-6">
          {/* Dynamic Financial Visualization Charts (Fixed Assets + Operating Expenses) */}
          <FinancialChartsCard
            groupedAssets={groupedAssets}
            pinnedAccounts={pinnedAccounts}
          />

          {/* Dynamic Active Production Cycles Table */}
          <ActiveCyclesCard cycles={cycles} />
        </div>

        <aside className="flex flex-col space-y-6 h-full">
          <NurseryInventoryCard
            items={lowStock}
            showDetails={showLowStockDetails}
            onToggleDetails={() => setShowLowStockDetails((visible) => !visible)}
          />
        </aside>
      </div>

      <QuickAccessModal
        open={quickAccessOpen}
        onClose={() => setQuickAccessOpen(false)}
        nurseries={mappedQuickAccess}
      />
    </div>
  )
}
