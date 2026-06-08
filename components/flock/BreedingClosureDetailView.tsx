'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Printer,
  Bird,
  Wallet,
  Scale,
  PieChart,
  Building2,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'
import { useFlock, useFlockSummary } from '@/lib/hooks/useFlock'
import { useFlockExpenses } from '@/lib/hooks/useExpenses'
import { Button } from '@/components/ui/Button'

type TableColumn = {
  key: string
  label: string
  align?: 'right' | 'center'
  mono?: boolean
}

interface BreedingClosureDetailViewProps {
  flockId: number
  barnId?: number
}

// Simulated fixed values for sections that are not yet connected to the backend database
const assetEntryRowsMock = [
  {
    date: '2025-08-07',
    reference: 'AST-20250807-01',
    statement: 'تحميل إهلاك عنبر P3 على رصيد الإغلاق',
    account: 'مجمع إهلاك العنابر',
    debit: '96,580.00',
    credit: '—',
    amount: 96_580,
    p31: 47_975.34,
    p32: 48_604.66,
  },
  {
    date: '2025-08-07',
    reference: 'AST-20250807-02',
    statement: 'تحميل إهلاك خطوط التغذية والتهوية',
    account: 'مجمع إهلاك المعدات',
    debit: '84,420.00',
    credit: '—',
    amount: 84_420,
    p31: 41_929.86,
    p32: 42_490.14,
  },
  {
    date: '2025-08-07',
    reference: 'AST-20250807-03',
    statement: 'تحميل إهلاك تجهيزات الخدمة المساندة',
    account: 'مجمع إهلاك أصول مساندة',
    debit: '31,260.00',
    credit: '—',
    amount: 31_260,
    p31: 15_529.97,
    p32: 15_730.03,
  },
]

const operationsRowsMock = [
  {
    label: 'قيمة بيت التربية الأساسية',
    total: '1,240,000.00',
    p31: '615,232.00',
    p32: '624,768.00',
  },
  {
    label: 'قيمة معدات التشغيل والخطوط',
    total: '1,085,000.00',
    p31: '538,128.00',
    p32: '546,872.00',
  },
  {
    label: 'قيمة الأصول المساندة',
    total: '412,500.00',
    p31: '204,516.00',
    p32: '207,984.00',
  },
  {
    label: 'إجمالي القيمة التشغيلية',
    total: '2,737,500.00',
    p31: '1,357,876.00',
    p32: '1,379,624.00',
  },
]

const depreciationProjectionRowsMock = [
  {
    label: 'الأيام التشغيلية',
    total: '568 يوم',
    '2025': '146',
    '2026': '365',
    '2027': '57',
  },
  {
    label: 'الأسابيع التشغيلية',
    total: '81 أسبوع',
    '2025': '20.86',
    '2026': '52.14',
    '2027': '8.00',
  },
  {
    label: 'السنوات التشغيلية',
    total: '1.56 سنة',
    '2025': '0.40',
    '2026': '1.00',
    '2027': '0.16',
  },
]

const monthlyDepreciationRowsMock = [
  {
    label: 'عنبر التربية',
    daily_p31: '84.46',
    daily_p32: '85.56',
    weekly_p31: '591.22',
    weekly_p32: '598.92',
    monthly_p31: '2,563.68',
    monthly_p32: '2,597.07',
  },
  {
    label: 'خطوط التغذية والتهوية',
    daily_p31: '73.82',
    daily_p32: '74.81',
    weekly_p31: '516.74',
    weekly_p32: '523.67',
    monthly_p31: '2,239.22',
    monthly_p32: '2,269.24',
  },
  {
    label: 'الأصول المساندة',
    daily_p31: '27.34',
    daily_p32: '27.69',
    weekly_p31: '191.38',
    weekly_p32: '193.83',
    monthly_p31: '829.31',
    monthly_p32: '839.95',
  },
  {
    label: 'الإجمالي الشهري',
    daily_p31: '185.62',
    daily_p32: '188.06',
    weekly_p31: '1,299.34',
    weekly_p32: '1,316.42',
    monthly_p31: '5,632.21',
    monthly_p32: '5,706.26',
  },
]

const assetLedgerColumnsMock: TableColumn[] = [
  { key: 'date', label: 'التاريخ' },
  { key: 'reference', label: 'المرجع' },
  { key: 'statement', label: 'البيان' },
  { key: 'account', label: 'الحساب / السجل' },
  { key: 'debit', label: 'مدين', align: 'center', mono: true },
  { key: 'credit', label: 'دائن', align: 'center', mono: true },
  { key: 'amount', label: 'المبلغ', align: 'center', mono: true },
  { key: 'p31', label: 'P3-1 (49.68%)', align: 'center', mono: true },
  { key: 'p32', label: 'P3-2 (50.32%)', align: 'center', mono: true },
]

const operationsColumnsMock: TableColumn[] = [
  { key: 'label', label: 'بيان العمليات' },
  { key: 'total', label: 'القيمة الأصلية', align: 'center', mono: true },
  { key: 'p31', label: 'P3-1', align: 'center', mono: true },
  { key: 'p32', label: 'P3-2', align: 'center', mono: true },
]

const depreciationColumnsMock: TableColumn[] = [
  { key: 'label', label: 'تفاصيل الإهلاك' },
  { key: 'total', label: 'الإجمالي' },
  { key: '2025', label: '2025', align: 'center', mono: true },
  { key: '2026', label: '2026', align: 'center', mono: true },
  { key: '2027', label: '2027', align: 'center', mono: true },
]

const monthlyColumnsMock: TableColumn[] = [
  { key: 'label', label: 'بيان الاستهلاك الشهري' },
  { key: 'daily_p31', label: 'يومي P3-1', align: 'center', mono: true },
  { key: 'daily_p32', label: 'يومي P3-2', align: 'center', mono: true },
  { key: 'weekly_p31', label: 'أسبوعي P3-1', align: 'center', mono: true },
  { key: 'weekly_p32', label: 'أسبوعي P3-2', align: 'center', mono: true },
  { key: 'monthly_p31', label: 'شهري P3-1', align: 'center', mono: true },
  { key: 'monthly_p32', label: 'شهري P3-2', align: 'center', mono: true },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

function KpiTile({
  label,
  value,
  subtitle,
  icon,
}: {
  label: string
  value: React.ReactNode
  subtitle?: string
  icon: React.ReactNode
}) {
  return (
    <article className="rounded-2xl border border-line bg-surface-subtle px-4 py-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-ink-muted">{label}</p>
          <div className="text-2xl font-bold text-ink font-mono">{value}</div>
        </div>
        <div className="rounded-xl bg-surface p-2.5 text-action-primary">{icon}</div>
      </div>
      {subtitle ? <p className="text-xs text-ink-soft">{subtitle}</p> : null}
    </article>
  )
}

function TableSection({
  title,
  description,
  todoBadge,
  columns,
  rows,
}: {
  title: string
  description?: string
  todoBadge?: string
  columns: readonly TableColumn[]
  rows: readonly Record<string, string | number>[]
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-ink flex items-center gap-2">
            {title}
            {todoBadge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-bold text-warning-strong">
                <AlertCircle className="h-3 w-3" />
                {todoBadge}
              </span>
            )}
          </h2>
          {description ? <p className="text-sm text-ink-soft">{description}</p> : null}
        </div>
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface lg:block">
        <table className="min-w-full border-collapse text-right text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-subtle text-ink-soft">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 font-semibold ${
                    column.align === 'center' ? 'text-center' : 'text-right'
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row, rowIndex) => (
              <tr key={`${title}-${rowIndex}`} className="align-top transition-colors hover:bg-surface-subtle">
                {columns.map((column) => (
                  <td
                    key={`${title}-${rowIndex}-${column.key}`}
                    className={`px-4 py-3 ${
                      column.align === 'center' ? 'text-center' : 'text-right'
                    } ${column.mono ? 'font-mono text-ink' : 'text-ink-soft'}`}
                  >
                    {typeof row[column.key] === 'number'
                      ? formatCurrency(row[column.key] as number)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {rows.map((row, rowIndex) => (
          <article
            key={`${title}-card-${rowIndex}`}
            className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {columns.map((column) => (
                <div
                  key={`${title}-card-${rowIndex}-${column.key}`}
                  className={`rounded-xl bg-surface-subtle px-3 py-2 ${
                    column.key === 'statement' || column.key === 'account' || column.key === 'label'
                      ? 'sm:col-span-2'
                      : ''
                  }`}
                >
                  <span className="block text-xs text-ink-muted">{column.label}</span>
                  <span className={`mt-1 block text-sm ${column.mono ? 'font-mono text-ink' : 'text-ink-soft'}`}>
                    {typeof row[column.key] === 'number'
                      ? formatCurrency(row[column.key] as number)
                      : row[column.key]}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function DistributionBar({
  distribution,
}: {
  distribution: { label: string; percentage: number; amount: number; tone: string }[]
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <PieChart className="h-5 w-5 text-action-primary" />
        <h2 className="text-lg font-bold text-ink">ملخص توزيع التكاليف (ديناميكي)</h2>
      </div>

      <div className="space-y-4">
        {distribution.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${item.tone}`}>
                  {item.label}
                </span>
                <span className="font-mono text-sm text-ink-soft">{item.percentage.toFixed(2)}%</span>
              </div>
              <span className="font-mono text-sm text-ink">
                {formatCurrency(item.amount)} <SaudiRiyalIcon size={14} className="ml-1 inline-block align-middle text-success-strong" />
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-subtle">
              <div
                className={`h-2 rounded-full ${item.tone.split(' ')[0]}`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function BreedingClosureDetailView({
  flockId,
  barnId,
}: BreedingClosureDetailViewProps) {
  const { data: flockResponse, isLoading: isFlockLoading, error: flockError } = useFlock(flockId)
  const { data: summary, isLoading: isSummaryLoading } = useFlockSummary(flockId)
  const { data: expensesResponse, isLoading: isExpensesLoading } = useFlockExpenses(flockId)

  const flock = flockResponse?.data
  const expenses = expensesResponse?.data ?? []

  const backHref = barnId ? `/barns/${barnId}` : `/flocks/${flockId}`

  if (isFlockLoading || isSummaryLoading || isExpensesLoading) {
    return (
      <div className="flex justify-center py-20" dir="rtl">
        <Loader2 className="h-10 w-10 animate-spin text-farm-blue" />
      </div>
    )
  }

  if (flockError || !flock) {
    return (
      <div className="py-20 text-center text-ink-muted" dir="rtl">
        لم يتم العثور على بيانات الفوج.
      </div>
    )
  }

  // 1. Dynamic Allocations & Reference Code
  const allocations = flock.closing_allocations ?? []
  const hasAllocations = allocations.length > 0
  const isCompleted = flock.status === 'completed'

  const closureReference = flock.exit_date 
    ? flock.exit_date.replace(/-/g, '') 
    : flock.entry_date 
      ? flock.entry_date.replace(/-/g, '') 
      : 'PENDING'

  // 2. Dynamic Costs Calculations
  const chickCost = flock.entry_birds * (Number(flock.chick_unit_cost) || 0)
  const feedCost = expenses
    .filter(e => e.category.includes('علف') || e.category.includes('أعلاف'))
    .reduce((sum, e) => sum + Number(e.amount), 0)
  const medicineCost = expenses
    .filter(e => e.category.includes('أدوية') || e.category.includes('علاج') || e.category.includes('بيطري'))
    .reduce((sum, e) => sum + Number(e.amount), 0)
  const otherCost = expenses
    .filter(e => 
      !e.category.includes('علف') && 
      !e.category.includes('أعلاف') && 
      !e.category.includes('أدوية') && 
      !e.category.includes('علاج') && 
      !e.category.includes('بيطري')
    )
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const totalCalculatedCosts = chickCost + feedCost + medicineCost + otherCost
  const totalClosingAllocationsValue = allocations.reduce((sum, a) => sum + (Number(a.value) || 0), 0)
  const totalCosts = isCompleted && totalClosingAllocationsValue > 0 
    ? totalClosingAllocationsValue 
    : totalCalculatedCosts

  const totalAllocatedBirds = allocations.reduce((sum, a) => sum + a.bird_count, 0)
  const remainingCount = isCompleted && totalAllocatedBirds > 0 ? totalAllocatedBirds : flock.current_count
  const unitCost = remainingCount > 0 ? totalCosts / remainingCount : 0

  // 3. Dynamic Cost Distribution Breakdown
  const costDistribution = [
    { label: 'الصوص', percentage: totalCosts > 0 ? (chickCost / totalCosts) * 100 : 0, amount: chickCost, tone: 'bg-info-soft text-info' },
    { label: 'الأعلاف', percentage: totalCosts > 0 ? (feedCost / totalCosts) * 100 : 0, amount: feedCost, tone: 'bg-success-soft text-success-strong' },
    { label: 'الأدوية', percentage: totalCosts > 0 ? (medicineCost / totalCosts) * 100 : 0, amount: medicineCost, tone: 'bg-warning-soft text-warning-strong' },
    { label: 'أخرى', percentage: totalCosts > 0 ? (otherCost / totalCosts) * 100 : 0, amount: otherCost, tone: 'bg-surface-muted text-ink-soft' },
  ]

  // 4. Dynamic General Ledger Columns & Splits
  const ledgerColumns: TableColumn[] = [
    { key: 'date', label: 'التاريخ' },
    { key: 'reference', label: 'المرجع' },
    { key: 'statement', label: 'البيان' },
    { key: 'account', label: 'الحساب / السجل' },
    { key: 'debit', label: 'مدين', align: 'center', mono: true },
    { key: 'credit', label: 'دائن', align: 'center', mono: true },
    { key: 'amount', label: 'المبلغ', align: 'center', mono: true },
  ]

  if (hasAllocations) {
    allocations.forEach(alloc => {
      ledgerColumns.push({
        key: `alloc_${alloc.id}`,
        label: `${alloc.allocation_label} (${Number(alloc.percentage).toFixed(2)}%)`,
        align: 'center',
        mono: true,
      })
    })
  } else {
    // Default fallback columns if active
    ledgerColumns.push(
      { key: 'p31', label: 'P3-1 (محاكاة 49.68%)', align: 'center', mono: true },
      { key: 'p32', label: 'P3-2 (محاكاة 50.32%)', align: 'center', mono: true }
    )
  }

  const generateLedgerRow = (
    refSuffix: string,
    statement: string,
    account: string,
    amount: number
  ) => {
    const row: Record<string, string | number> = {
      date: flock.exit_date || flock.entry_date || '—',
      reference: `CLS-${closureReference}-${refSuffix}`,
      statement,
      account,
      debit: formatCurrency(amount),
      credit: '—',
      amount,
    }

    if (hasAllocations) {
      allocations.forEach(alloc => {
        row[`alloc_${alloc.id}`] = formatCurrency(amount * (Number(alloc.percentage) / 100))
      })
    } else {
      row['p31'] = formatCurrency(amount * 0.4968)
      row['p32'] = formatCurrency(amount * 0.5032)
    }

    return row
  }

  const financialLedgerRows = [
    generateLedgerRow('01', 'إقفال تكلفة الصوص وتوزيعها على وجهات التربية', 'مخزون أفواج التربية', chickCost),
    generateLedgerRow('02', 'توزيع استهلاك الأعلاف بعد الإغلاق', 'مصروف أعلاف تراكمي', feedCost),
    generateLedgerRow('03', 'تحميل الأدوية والمستهلكات الطبية', 'مخزون أدوية / علاج', medicineCost),
    generateLedgerRow('04', 'تحميل المصروفات التشغيلية المساندة', 'مصروفات تشغيلية أخرى', otherCost),
  ]

  const financialTotalRow = {
    date: '—',
    reference: 'BALANCE',
    statement: 'صافي القيود بعد التوزيع',
    account: 'إجمالي التوزيع المالي',
    debit: '—',
    credit: '—',
    amount: totalCosts,
    ...(hasAllocations
      ? allocations.reduce((acc, alloc) => {
          acc[`alloc_${alloc.id}`] = formatCurrency(totalCosts * (Number(alloc.percentage) / 100))
          return acc
        }, {} as Record<string, string>)
      : {
          p31: formatCurrency(totalCosts * 0.4968),
          p32: formatCurrency(totalCosts * 0.5032),
        }),
  }

  const assetTotalRow = {
    date: '—',
    reference: 'AMORT',
    statement: 'إجمالي القيود الرأسمالية بعد التوزيع',
    account: 'قيد أصول متراكم',
    debit: '—',
    credit: '—',
    amount: 212_260,
    p31: 105_435.17,
    p32: 106_824.83,
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Informational Banner about Simulated & Dynamic Systems */}
      <div className="rounded-2xl border border-warning-soft bg-warning-soft/30 p-4 text-warning-strong text-sm font-semibold space-y-1">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning-strong" />
          <span>تنبيه محاذاة البيانات البرمجية:</span>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed">
          تم تحديث هذه الصفحة لتعمل بديناميكية تامة مع سجلات ومصروفات الفوج الحالي.
          الأقسام الخاصة بـ <strong>(قيود الأصول، بيان العمليات، تفاصيل الإهلاك، والاستهلاك الشهري)</strong> هي قيم تقديرية/محاكاة حالياً لحين إتمام ربط نظام الأصول الثابتة وإهلاك الحظائر البرمجي بالكامل.
        </p>
      </div>

      <header className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-ink">
            إغلاق الفوج {closureReference}
            {!isCompleted && <span className="mr-2 inline-flex items-center rounded-full bg-info-soft px-2.5 py-0.5 text-xs font-bold text-info">قيد التشغيل (محاكاة الإغلاق)</span>}
          </h1>
          <p className="text-sm text-ink-soft">إدارة عملية الإغلاق وتوزيع التكاليف الحقيقية</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
            <span>فوج التربية #{flockId}</span>
            <span>الوجهات: {hasAllocations ? allocations.map(a => a.allocation_label).join(' / ') : 'غير محددة (طرح افتراضي P3-1 / P3-2)'}</span>
            <span>نسبة التوزيع: {hasAllocations ? allocations.map(a => `${a.allocation_label}: ${Number(a.percentage).toFixed(2)}%`).join(' / ') : '49.68% / 50.32% (افتراضي)'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" leftIcon={<ArrowRight className="h-4 w-4" />}>
            <Link href={backHref}>
              عودة للفوج
            </Link>
          </Button>
          <Button
            type="button"
            onClick={() => window.print()}
            variant="outline"
            leftIcon={<Printer className="h-4 w-4" />}
          >
            طباعة التفاصيل
          </Button>
        </div>
      </header>

      {/* Dynamic KPI Tiles */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <KpiTile
          label="العدد المتبقي"
          value={formatInteger(remainingCount)}
          subtitle={isCompleted ? "الكمية الموزعة عند الإغلاق التام" : "الكمية الحالية (الفوج لا يزال نشطاً)"}
          icon={<Bird className="h-5 w-5" />}
        />
        <KpiTile
          label="إجمالي التكاليف (المصروفات + الصوص)"
          value={
            <>
              {formatCurrency(totalCosts)}{' '}
              <SaudiRiyalIcon size={18} className="inline-block align-middle text-success-strong" />
            </>
          }
          subtitle="مجموع سعر شراء الصوص وكافة المصروفات النثرية"
          icon={<Wallet className="h-5 w-5" />}
        />
        <KpiTile
          label="متوسط تكلفة الطير الواحد"
          value={
            <>
              {unitCost.toFixed(2)}{' '}
              <SaudiRiyalIcon size={18} className="inline-block align-middle text-success-strong" />
            </>
          }
          subtitle="إجمالي التكاليف مقسوماً على العدد المتبقي"
          icon={<Scale className="h-5 w-5" />}
        />
      </section>

      {/* Dynamic Cost Breakdown Bar */}
      <DistributionBar distribution={costDistribution} />

      {/* Dynamic General Ledger Entries Section */}
      <TableSection
        title="سجلات الإغلاق المالية"
        description="توزيع قيم الصوص والمصروفات المسجلة ديناميكياً بين وجهات الإغلاق المعتمدة."
        todoBadge="محسوب تلقائياً"
        columns={ledgerColumns}
        rows={[...financialLedgerRows, financialTotalRow]}
      />

      {/* Simulated Sections with Clear TODO/Simulated Reminders */}
      <TableSection
        title="قيود الأصول (محاكاة)"
        description="توزيع القيود الرأسمالية ومجمعات الإهلاك الافتراضية بين وجهات التربية."
        todoBadge="TODO: ربط الأصول الثابتة"
        columns={assetLedgerColumnsMock}
        rows={[...assetEntryRowsMock, assetTotalRow]}
      />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TableSection
          title="بيان العمليات (محاكاة)"
          description="خريطة القيمة التشغيلية الافتراضية للأصول الأساسية بعد تقسيم البيت."
          todoBadge="TODO: ربط الأصول الثابتة"
          columns={operationsColumnsMock}
          rows={operationsRowsMock}
        />

        <TableSection
          title="تفاصيل الإهلاك (محاكاة)"
          description="توزيع الفترات الزمنية والتشغيلية الافتراضية على أعوام الإقفال."
          todoBadge="TODO: ربط الأصول الثابتة"
          columns={depreciationColumnsMock}
          rows={depreciationProjectionRowsMock}
        />
      </section>

      <TableSection
        title="بيان الاستهلاك الشهري (محاكاة)"
        description="توزيع الإهلاك اليومي والأسبوعي والشهري الافتراضي للحظيرة على خطوط التشغيل."
        todoBadge="TODO: ربط الأصول الثابتة"
        columns={monthlyColumnsMock}
        rows={monthlyDepreciationRowsMock}
      />

      {/* Dynamic Closing Summary */}
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-action-primary" />
          <h2 className="text-lg font-bold text-ink">ملخص التوزيع والتحميل المالي للوجهات</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hasAllocations ? (
            allocations.map(alloc => (
              <div key={alloc.id} className="rounded-xl bg-surface-subtle px-4 py-3 border border-line">
                <span className="block text-xs text-ink-muted">حصة وجهة {alloc.allocation_label} ({Number(alloc.percentage).toFixed(2)}%)</span>
                <span className="mt-1 block font-mono text-lg font-bold text-ink">
                  {formatCurrency(totalCosts * (Number(alloc.percentage) / 100))} <SaudiRiyalIcon size={16} className="ml-1 inline-block align-middle text-success-strong" />
                </span>
                <span className="block text-xs text-ink-soft mt-1">الكمية: {alloc.bird_count.toLocaleString()} طير</span>
              </div>
            ))
          ) : (
            <>
              <div className="rounded-xl bg-surface-subtle px-4 py-3 border border-dashed border-line">
                <span className="block text-xs text-ink-muted">حصة بيت P3-1 (افتراضي 49.68%)</span>
                <span className="mt-1 block font-mono text-lg font-bold text-ink">
                  {formatCurrency(totalCosts * 0.4968)} <SaudiRiyalIcon size={16} className="ml-1 inline-block align-middle text-success-strong" />
                </span>
              </div>
              <div className="rounded-xl bg-surface-subtle px-4 py-3 border border-dashed border-line">
                <span className="block text-xs text-ink-muted">حصة بيت P3-2 (افتراضي 50.32%)</span>
                <span className="mt-1 block font-mono text-lg font-bold text-ink">
                  {formatCurrency(totalCosts * 0.5032)} <SaudiRiyalIcon size={16} className="ml-1 inline-block align-middle text-success-strong" />
                </span>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
