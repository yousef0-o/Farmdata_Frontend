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
  Coins,
  Grid3X3,
  Layers3,
  MapPin,
  PackageSearch,
  Ruler,
  Search,
  Sprout,
  Trees,
  Warehouse,
  X,
} from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'

type MetricTile = {
  id: string
  label: string
  value: string
  unit?: string
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

type NurseryDashboardMock = {
  metrics: MetricTile[]
  capacity: CapacityOverview
  potDistribution: ChartDatum[]
  speciesDistribution: ChartDatum[]
  structure: StructureMetric[]
  lowStock: LowStockItem[]
  quickAccess: NurseryOption[]
}

type NurserySelection = {
  nurseryId: string
  locationId: string
  sectionId: string
  basinId: string
}

const NURSERY_DASHBOARD_MOCK: NurseryDashboardMock = {
  metrics: [
    {
      id: 'total-trees',
      label: 'إجمالي الأشجار',
      value: '33,108',
      icon: Trees,
      tone: 'emerald',
    },
    {
      id: 'total-capacity',
      label: 'الطاقة الاستيعابية',
      value: '252,661',
      icon: Ruler,
      tone: 'blue',
    },
    {
      id: 'inventory-value',
      label: 'قيمة المخزون',
      value: '15,078',
      unit: 'ريال',
      icon: Boxes,
      tone: 'slate',
    },
    {
      id: 'asset-value',
      label: 'قيمة الأصول',
      value: '694,789',
      unit: 'ريال',
      icon: Coins,
      tone: 'purple',
    },
    {
      id: 'total-expenses',
      label: 'إجمالي المصروفات',
      value: '1,445,378',
      unit: 'ريال',
      icon: CircleDollarSign,
      tone: 'orange',
    },
    {
      id: 'sales-revenue',
      label: 'الإيرادات (من فواتير المبيعات)',
      value: '57.50',
      unit: 'ريال',
      icon: PackageSearch,
      tone: 'amber',
    },
  ],
  capacity: {
    total: 252661,
    totalDisplay: '252,661',
    planted: 33108,
    plantedDisplay: '33,108',
    utilizationDisplay: '13.10%',
  },
  potDistribution: [
    {
      label: 'مركن مقاس 30 سم',
      value: 21850,
      valueDisplay: '21,850',
      color: '#10b981',
    },
    {
      label: 'حفرة مقاس متر',
      value: 6120,
      valueDisplay: '6,120',
      color: '#3b82f6',
    },
    {
      label: 'مركن مقاس 20 سم',
      value: 5138,
      valueDisplay: '5,138',
      color: '#c2410c',
    },
  ],
  speciesDistribution: [
    {
      label: 'الخبيز الساحلي',
      value: 18420,
      valueDisplay: '18,420',
      color: '#10b981',
    },
    {
      label: 'الكونوكاربس',
      value: 9760,
      valueDisplay: '9,760',
      color: '#3b82f6',
    },
    {
      label: 'إليكس أخضر',
      value: 4928,
      valueDisplay: '4,928',
      color: '#c2410c',
    },
  ],
  structure: [
    {
      id: 'nurseries',
      label: 'المشاتل',
      value: '1',
      dotClassName: 'bg-[#10b981]',
    },
    {
      id: 'locations',
      label: 'المواقع',
      value: '9',
      dotClassName: 'bg-blue-500',
    },
    {
      id: 'sections',
      label: 'الأقسام',
      value: '22',
      dotClassName: 'bg-[#c2410c]',
    },
    {
      id: 'basins',
      label: 'الأحواض',
      value: '114',
      dotClassName: 'bg-purple-500',
    },
    {
      id: 'area',
      label: 'المساحة',
      value: '124,628 م²',
      dotClassName: 'bg-amber-500',
    },
  ],
  lowStock: [
    {
      id: 'fertilizer-yellow-top-ten',
      name: 'سماد توب تن لون أصفر',
      unit: 'كيس',
      currentQuantity: 0,
      minQuantity: 12,
    },
    {
      id: 'fertilizer-green-top-ten',
      name: 'سماد توب تن لون أخضر',
      unit: 'كيس',
      currentQuantity: 0,
      minQuantity: 10,
    },
    {
      id: 'fertilizer-phosphorus',
      name: 'سماد عالي الفوسفور',
      unit: 'كجم',
      currentQuantity: 0,
      minQuantity: 25,
    },
    {
      id: 'fertilizer-micro-elements',
      name: 'سماد توازن العناصر الصغرى',
      unit: 'عبوة',
      currentQuantity: 0,
      minQuantity: 8,
    },
  ],
  quickAccess: [
    {
      id: 'nursery-main',
      name: 'مشتل صبارة الرئيسي',
      locations: [
        {
          id: 'loc-north',
          name: 'الموقع الشمالي',
          sections: [
            {
              id: 'sec-a',
              name: 'القسم أ',
              basins: [
                { id: 'basin-a-01', name: 'حوض A-01' },
                { id: 'basin-a-02', name: 'حوض A-02' },
                { id: 'basin-a-03', name: 'حوض A-03' },
              ],
            },
            {
              id: 'sec-b',
              name: 'القسم ب',
              basins: [
                { id: 'basin-b-01', name: 'حوض B-01' },
                { id: 'basin-b-02', name: 'حوض B-02' },
              ],
            },
          ],
        },
        {
          id: 'loc-south',
          name: 'الموقع الجنوبي',
          sections: [
            {
              id: 'sec-c',
              name: 'القسم ج',
              basins: [
                { id: 'basin-c-01', name: 'حوض C-01' },
                { id: 'basin-c-02', name: 'حوض C-02' },
              ],
            },
          ],
        },
      ],
    },
  ],
}

const toneClasses: Record<MetricTile['tone'], string> = {
  emerald: 'bg-emerald-50 text-[#10b981] border-emerald-100',
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  orange: 'bg-orange-50 text-[#c2410c] border-orange-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  slate: 'bg-slate-50 text-slate-600 border-slate-100',
}

const selectBaseClassName =
  'h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pl-10 text-sm font-semibold text-slate-800 outline-none transition-all duration-200 hover:border-slate-300 focus:border-[#10b981] focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-900'

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`
}

function MetricCard({ metric }: { metric: MetricTile }) {
  const Icon = metric.icon

  return (
    <article className="flex min-h-32 items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-md dark:border-slate-800 dark:bg-surface">
      <div className="min-w-0 text-right">
        <p className="text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">
          {metric.label}
        </p>
        <div className="mt-3 flex flex-wrap items-baseline justify-start gap-2">
          <span className="font-mono text-2xl font-extrabold leading-none text-slate-950 dark:text-slate-50">
            {metric.value}
          </span>
          {metric.unit ? (
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
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
    <div>
      <div className="mb-3 flex items-center justify-between gap-4 text-sm font-bold">
        <span className="text-slate-800 dark:text-slate-100">{label}</span>
        <span className="font-mono text-slate-500 dark:text-slate-400">{value}</span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-700">
        <div
          className={`h-full rounded-full ${toneClassName}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  )
}

function CapacityCard({ capacity }: { capacity: CapacityOverview }) {
  const utilization = (capacity.planted / capacity.total) * 100

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface sm:p-6">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#10b981] ring-1 ring-emerald-100">
            <ChartPie className="h-5 w-5" />
          </span>
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-50">
            مقارنة السعة والزراعة
          </h2>
        </div>
        <span className="w-fit rounded-xl bg-emerald-50 px-3 py-2 text-sm font-extrabold text-emerald-700 ring-1 ring-emerald-100">
          نسبة التشغيل: {capacity.utilizationDisplay}
        </span>
      </div>

      <div className="space-y-6">
        <ProgressRow
          label={`الطاقة الاستيعابية (${capacity.totalDisplay})`}
          value={capacity.totalDisplay}
          percent={100}
          toneClassName="bg-[#10b981]"
        />
        <ProgressRow
          label={`الأشجار القائمة (${capacity.plantedDisplay})`}
          value={formatPercent(utilization)}
          percent={utilization}
          toneClassName="bg-[#c2410c]"
        />
      </div>
    </section>
  )
}

function PotSizeChart({ data }: { data: ChartDatum[] }) {
  const maxValue = Math.max(...data.map((item) => item.value))

  return (
    <div className="min-h-[320px] rounded-2xl border border-slate-100 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h3 className="text-base font-extrabold text-slate-950 dark:text-slate-50">
          توزيع الأشجار حسب حجم المركن
        </h3>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#c2410c] ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800">
          <ChartColumn className="h-4 w-4" />
        </span>
      </div>

      <div className="flex h-56 items-end justify-around gap-4 rounded-2xl bg-white px-4 pb-4 pt-6 ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800">
        {data.map((item) => (
          <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-3">
            <div className="flex h-full w-full items-end justify-center">
              <div
                className="w-full max-w-16 rounded-t-2xl shadow-sm transition-all duration-300"
                style={{
                  height: `${Math.max((item.value / maxValue) * 100, 14)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <div className="min-h-16 text-center">
              <p className="font-mono text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {item.valueDisplay}
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SpeciesDonutChart({ data }: { data: ChartDatum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="min-h-[320px] rounded-2xl border border-slate-100 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h3 className="text-base font-extrabold text-slate-950 dark:text-slate-50">
          توزيع الأشجار حسب النوع
        </h3>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#10b981] ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800">
          <ChartPie className="h-4 w-4" />
        </span>
      </div>

      <div className="grid min-h-56 grid-cols-1 items-center gap-6 rounded-2xl bg-white p-5 ring-1 ring-slate-100 dark:bg-slate-950 dark:ring-slate-800 sm:grid-cols-[0.9fr_1.1fr]">
        <div className="relative mx-auto h-44 w-44">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" role="img" aria-label="رسم دائري لتوزيع الأشجار حسب النوع">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="16"
              className="text-slate-100 dark:text-slate-800"
            />
            {data.map((item) => {
              const segment = (item.value / total) * circumference
              const dashOffset = offset
              offset += segment

              return (
                <circle
                  key={item.label}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={`${segment} ${circumference - segment}`}
                  strokeDashoffset={-dashOffset}
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-mono text-2xl font-extrabold text-slate-950 dark:text-slate-50">
              33,108
            </span>
            <span className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
              شجرة
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-[4px]"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">
                  {item.label}
                </span>
              </div>
              <span className="font-mono text-sm font-extrabold text-slate-950 dark:text-slate-50">
                {item.valueDisplay}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
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
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface sm:p-6">
      <div className="grid gap-5 xl:grid-cols-2">
        <PotSizeChart data={potDistribution} />
        <SpeciesDonutChart data={speciesDistribution} />
      </div>
    </section>
  )
}

function StructureCard({ structure }: { structure: StructureMetric[] }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800">
          <Warehouse className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-50">
          هيكل المشتل
        </h2>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {structure.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${item.dotClassName}`} />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                {item.label}
              </span>
            </div>
            <span className="font-mono text-base font-extrabold text-slate-950 dark:text-slate-50">
              {item.value}
            </span>
          </div>
        ))}
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
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-slate-50">
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

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-slate-800">
                {item.name}
              </p>
              {showDetails ? (
                <p className="mt-1 text-xs font-semibold text-amber-700">
                  الحد الأدنى: {item.minQuantity} {item.unit}
                </p>
              ) : null}
            </div>
            <div className="text-left">
              <span className="block font-mono text-xl font-extrabold text-amber-700">
                {item.currentQuantity}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {item.unit}
              </span>
            </div>
          </div>
        ))}
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
      <div className="max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-surface">
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق الوصول السريع"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:rotate-90 hover:bg-red-50 hover:text-red-500 active:scale-[0.98]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#10b981] ring-1 ring-emerald-100">
            <Grid3X3 className="h-7 w-7" />
          </div>
          <h2 id="quick-access-title" className="text-xl font-extrabold text-slate-950 dark:text-slate-50">
            الوصول السريع للأحواض
          </h2>
          <p id="quick-access-description" className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
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
          onClick={isPathComplete ? onClose : undefined}
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
  const [dashboardData] = useState<NurseryDashboardMock>(NURSERY_DASHBOARD_MOCK)
  const [quickAccessOpen, setQuickAccessOpen] = useState(false)
  const [showLowStockDetails, setShowLowStockDetails] = useState(false)

  return (
    <div className="min-h-full space-y-6 bg-[#f8fafc] text-slate-950 dark:bg-background dark:text-slate-50" dir="rtl">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-surface sm:flex-row sm:items-center sm:justify-between">
        <div className="text-right">
          <h1 className="text-2xl font-extrabold tracking-normal text-slate-950 dark:text-slate-50">
            نظرة عامة
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
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
        {dashboardData.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <CapacityCard capacity={dashboardData.capacity} />
          <ChartsCard
            potDistribution={dashboardData.potDistribution}
            speciesDistribution={dashboardData.speciesDistribution}
          />
        </div>

        <aside className="space-y-6">
          <StructureCard structure={dashboardData.structure} />
          <NurseryInventoryCard
            items={dashboardData.lowStock}
            showDetails={showLowStockDetails}
            onToggleDetails={() => setShowLowStockDetails((visible) => !visible)}
          />
        </aside>
      </div>

      <QuickAccessModal
        open={quickAccessOpen}
        onClose={() => setQuickAccessOpen(false)}
        nurseries={dashboardData.quickAccess}
      />
    </div>
  )
}
