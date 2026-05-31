'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgePlus,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleDollarSign,
  FileSpreadsheet,
  FolderTree,
  GripVertical,
  Landmark,
  Loader2,
  Package2,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  WalletCards,
  X,
  PencilLine,
  Rows3,
} from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'
import { nurseryExpensesApi } from '@/lib/api/nurseryExpenses'
import {
  useBulkDeleteNurseryAssets,
  useBulkUpdateNurseryAssetCategory,
  useCreateNurseryAsset,
  useCreateNurseryExpenseAccount,
  useCreateNurseryExpenseTransaction,
  useDeleteNurseryAsset,
  useDeleteNurseryExpenseAccount,
  useImportNurseryAssets,
  useMoveNurseryExpenseAccount,
  useNurseryExpenseDetails,
  useNurseryExpensesBootstrap,
  useToggleNurseryExpenseAccountPin,
  useUpdateNurseryAsset,
  useUpdateNurseryExpenseAccount,
  useUploadNurseryExpenseFile,
} from '@/lib/hooks/useNurseryExpenses'
import type {
  ApiError,
  NurseryAsset,
  NurseryAssetCategory,
  NurseryAssetPayload,
  NurseryExpenseAccount,
  NurseryExpenseAccountNode,
  NurseryExpenseAccountPayload,
  NurseryExpenseBootstrap,
  NurseryExpenseDetails,
  NurseryExpenseTransactionPayload,
} from '@/lib/types'

type ExpensesTab = 'tree' | 'assets'

type AccountDialogState =
  | { mode: 'create-root'; account: null; parentId: null }
  | { mode: 'create-child'; account: null; parentId: number }
  | { mode: 'edit'; account: NurseryExpenseAccountNode; parentId: number | null }

const monthNames = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const

const excelMimeTypes = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const accountSchema = z.object({
  name: z.string().trim().min(1, 'اسم الحساب مطلوب').max(255, 'الاسم طويل جداً'),
  parent_id: z.number().nullable(),
})

const transactionSchema = z.object({
  operation_number: z.string().trim().max(50, 'رقم العملية يجب ألا يتجاوز 50 حرفاً').optional(),
  entry_number: z.string().trim().max(50, 'رقم القيد يجب ألا يتجاوز 50 حرفاً').optional(),
  expense_date: z.string().trim().min(1, 'التاريخ مطلوب'),
  description: z.string().trim().optional(),
  debit_amount: z.coerce.number().min(0, 'المدين يجب أن يكون 0 أو أكثر'),
  credit_amount: z.coerce.number().min(0, 'الدائن يجب أن يكون 0 أو أكثر').nullable(),
})

const assetSchema = z.object({
  name: z.string().trim().min(1, 'اسم الأصل مطلوب').max(255, 'اسم الأصل طويل جداً'),
  code: z.string().trim().max(50, 'رمز الأصل يجب ألا يتجاوز 50 حرفاً').optional(),
  document_number: z.string().trim().max(50, 'رقم المستند يجب ألا يتجاوز 50 حرفاً').optional(),
  purchase_date: z.string().trim().min(1, 'تاريخ الشراء مطلوب'),
  purchase_value: z.coerce.number().min(0, 'قيمة الشراء يجب أن تكون 0 أو أكثر'),
  asset_type: z.enum(['fixed', 'current'], { message: 'نوع حساب الأصل مطلوب' }),
  asset_account_number: z.string().trim().max(50, 'رقم حساب الأصل يجب ألا يتجاوز 50 حرفاً').optional(),
  category_id: z.number().nullable(),
  expense_account_id: z.number().nullable(),
  expense_account_name: z.string().trim().max(255, 'اسم حساب المصروف طويل جداً').optional(),
  expense_account_number: z.string().trim().max(50, 'رقم حساب المصروف يجب ألا يتجاوز 50 حرفاً').optional(),
  account_name: z.string().trim().max(255, 'اسم الحساب طويل جداً').optional(),
})

const excelUploadSchema = z.object({
  file: z
    .custom<FileList | undefined>((value) => value === undefined || value instanceof FileList)
    .refine((files) => files instanceof FileList && files.length > 0, 'يرجى اختيار ملف إكسيل')
    .refine((files) => {
      const file = files?.item(0)
      if (!file) return false
      const extension = file.name.toLowerCase()
      return extension.endsWith('.xlsx') || extension.endsWith('.xls') || excelMimeTypes.includes(file.type)
    }, 'الملف يجب أن يكون بصيغة .xlsx أو .xls'),
})

const bulkCategorySchema = z.object({
  category_id: z.number().nullable(),
})

type AccountFormValues = z.infer<typeof accountSchema>
type AccountFormInput = z.input<typeof accountSchema>
type TransactionFormValues = z.infer<typeof transactionSchema>
type TransactionFormInput = z.input<typeof transactionSchema>
type AssetFormValues = z.infer<typeof assetSchema>
type AssetFormInput = z.input<typeof assetSchema>
type ExcelUploadFormValues = z.infer<typeof excelUploadSchema>
type ExcelUploadFormInput = z.input<typeof excelUploadSchema>
type BulkCategoryFormValues = z.infer<typeof bulkCategorySchema>
type BulkCategoryFormInput = z.input<typeof bulkCategorySchema>

type CombinedLedgerRow = {
  key: string
  date: string | null
  operation_number: string | null
  entry_number: string | null
  description: string | null
  debit: number
  credit: number
  balance: number
  source: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('ar-SA', {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits === 0 ? 0 : Number.isInteger(value) ? 0 : 2,
  }).format(value)
}

function formatDate(date: string | null | undefined) {
  if (!date) return 'غير مسجل'

  try {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  } catch {
    return date
  }
}

function getErrorMessage(error: unknown) {
  const fallback = 'حدث خطأ غير متوقع أثناء تنفيذ العملية.'
  if (!error || typeof error !== 'object') return fallback

  const apiError = error as ApiError
  if (typeof apiError.message === 'string' && apiError.message.trim()) return apiError.message

  if (apiError.errors) {
    const firstFieldErrors = Object.values(apiError.errors)[0]
    if (firstFieldErrors?.[0]) return firstFieldErrors[0]
  }

  return fallback
}

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

function flattenAccounts(nodes: NurseryExpenseAccountNode[]): NurseryExpenseAccountNode[] {
  return nodes.flatMap((node) => [node, ...flattenAccounts(node.children)])
}

function collectDescendantIds(node: NurseryExpenseAccountNode): Set<number> {
  const ids = new Set<number>()

  const walk = (current: NurseryExpenseAccountNode) => {
    ids.add(current.id)
    current.children.forEach(walk)
  }

  walk(node)
  return ids
}

function buildAccountOptions(
  nodes: NurseryExpenseAccountNode[],
  disabledIds = new Set<number>(),
  depth = 0
): Array<{ id: number; label: string }> {
  return nodes.flatMap((node) => {
    const current = disabledIds.has(node.id)
      ? []
      : [{ id: node.id, label: `${'— '.repeat(depth)}${node.name}` }]

    return [...current, ...buildAccountOptions(node.children, disabledIds, depth + 1)]
  })
}

function combineLedgerRows(details: NurseryExpenseDetails | undefined): CombinedLedgerRow[] {
  if (!details) return []

  const transactionRows = details.transactions.map((transaction) => ({
    key: `transaction-${transaction.id}`,
    date: transaction.transaction_date,
    operation_number: transaction.operation_number,
    entry_number: transaction.entry_number,
    description: transaction.description,
    debit: transaction.debit_amount,
    credit: transaction.credit_amount,
    balance: transaction.balance,
    source: transaction.file_name ? `ملف: ${transaction.file_name}` : transaction.source,
  }))

  const oldExpenseRows = details.old_expenses.map((expense) => ({
    key: `legacy-${expense.id}`,
    date: expense.expense_date,
    operation_number: null,
    entry_number: null,
    description: expense.description,
    debit: expense.amount,
    credit: 0,
    balance: expense.amount,
    source: expense.file_path ? 'مرفق قديم' : expense.source,
  }))

  return [...transactionRows, ...oldExpenseRows].sort((left, right) => {
    const leftDate = left.date ? new Date(left.date).getTime() : 0
    const rightDate = right.date ? new Date(right.date).getTime() : 0
    return rightDate - leftDate
  })
}

function buildMonthlyYearCards(monthlySummary: NurseryExpenseDetails['monthly_summary']) {
  const grouped = new Map<
    string,
    {
      year: string
      total: number
      months: Array<{ index: number; name: string; value: number }>
    }
  >()

  for (const item of monthlySummary) {
    if (!grouped.has(item.year)) {
      grouped.set(item.year, {
        year: item.year,
        total: 0,
        months: monthNames.map((name, index) => ({ index, name, value: 0 })),
      })
    }

    const yearEntry = grouped.get(item.year)
    if (!yearEntry) continue

    const monthIndex = Math.max(0, Number(item.month) - 1)
    yearEntry.total += item.total
    yearEntry.months[monthIndex] = {
      index: monthIndex,
      name: monthNames[monthIndex],
      value: item.total,
    }
  }

  return Array.from(grouped.values()).sort((left, right) => Number(right.year) - Number(left.year))
}

function HeaderActionButton({
  icon: Icon,
  label,
  tone = 'primary',
  disabled,
  onClick,
  href,
}: {
  icon: typeof Plus
  label: string
  tone?: 'primary' | 'secondary'
  disabled?: boolean
  onClick?: () => void
  href?: string
}) {
  const className = `inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold active:scale-[0.98] transition-all duration-200 ${
    tone === 'primary'
      ? 'bg-action-primary text-white shadow-[0_18px_35px_rgba(194,65,12,0.16)] hover:bg-action-primary-hover'
      : 'border border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink'
  } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`

  if (href) {
    return (
      <a href={href} download className={className}>
        <Icon className="h-4 w-4" />
        {label}
      </a>
    )
  }

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={className}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function StatCard({
  icon: Icon,
  title,
  value,
  helper,
  tone,
}: {
  icon: typeof WalletCards
  title: string
  value: string
  helper: string
  tone: 'clay' | 'emerald' | 'slate' | 'amber'
}) {
  const badgeClass =
    tone === 'clay'
      ? 'bg-[rgba(194,65,12,0.1)] text-action-primary'
      : tone === 'emerald'
        ? 'bg-emerald-100 text-emerald-700'
        : tone === 'amber'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-surface-subtle text-ink-soft'

  return (
    <article className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm transition-all duration-200 hover:border-line-strong hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-ink-muted">{title}</p>
          <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">{helper}</p>
        </div>
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${badgeClass}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof FolderTree
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-line bg-surface p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-subtle text-ink-muted">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}

function TabSwitcher({
  activeTab,
  onChange,
}: {
  activeTab: ExpensesTab
  onChange: (tab: ExpensesTab) => void
}) {
  const tabs: Array<{ id: ExpensesTab; label: string; icon: typeof FolderTree; helper: string }> = [
    {
      id: 'tree',
      label: 'شجرة حسابات المصروفات',
      icon: FolderTree,
      helper: 'الشجرة، الحركات، وملخصات السنوات والشهور',
    },
    {
      id: 'assets',
      label: 'تكاليف أصول المشتل',
      icon: Package2,
      helper: 'دفتر الأصول، الاستيراد، والعمليات الجماعية',
    },
  ]

  return (
    <div className="rounded-[2rem] border border-line bg-surface p-3 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`rounded-[1.5rem] border px-5 py-4 text-right active:scale-[0.98] transition-all duration-200 ${
                isActive
                  ? 'border-action-primary bg-[rgba(194,65,12,0.08)] shadow-[0_14px_28px_rgba(194,65,12,0.12)]'
                  : 'border-line bg-surface hover:border-line-strong hover:bg-surface-subtle'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={`text-base font-bold ${isActive ? 'text-action-primary' : 'text-ink'}`}>
                    {tab.label}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{tab.helper}</p>
                </div>
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    isActive ? 'bg-action-primary text-white' : 'bg-surface-subtle text-ink-soft'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function YearlySummaryLane({
  details,
  fallbackYearlyTotals,
}: {
  details: NurseryExpenseDetails | undefined
  fallbackYearlyTotals: NurseryExpenseAccountNode['yearly_totals']
}) {
  const cards = useMemo(() => buildMonthlyYearCards(details?.monthly_summary ?? []), [details?.monthly_summary])
  const [expandedYear, setExpandedYear] = useState<string | null>(null)
  const activeYear = expandedYear ?? cards[0]?.year ?? null

  if (cards.length === 0) {
    if (fallbackYearlyTotals.length === 0) {
      return (
        <div className="rounded-[1.75rem] border border-dashed border-line bg-surface p-5 text-sm text-ink-soft">
          لا توجد بيانات شهرية أو سنوية متاحة لهذا الحساب حتى الآن.
        </div>
      )
    }

    return (
      <div className="grid gap-3">
        {fallbackYearlyTotals.map((item) => (
          <div key={item.year} className="rounded-[1.5rem] border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-ink">إجمالي سنة {item.year}</p>
              <p className="font-semibold text-action-primary">{formatCurrency(item.total)}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {cards.map((card) => {
        const isOpen = activeYear === card.year

        return (
          <article key={card.year} className="overflow-hidden rounded-[1.5rem] border border-line bg-surface">
            <button
              type="button"
              onClick={() => setExpandedYear(isOpen ? null : card.year)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-right active:scale-[0.98] transition-all duration-200 hover:bg-surface-subtle"
            >
              <div>
                <p className="text-sm font-bold text-ink">ملخص سنة {card.year}</p>
                <p className="mt-1 text-xs text-ink-muted">إجمالي الحركة المجدولة شهرياً</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[rgba(194,65,12,0.08)] px-3 py-1.5 text-sm font-bold text-action-primary">
                  {formatCurrency(card.total)}
                </span>
                <ChevronDown className={`h-4 w-4 text-ink-soft transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {isOpen ? (
              <div className="grid gap-3 border-t border-line bg-surface-subtle p-4 sm:grid-cols-2">
                {card.months.map((month) => (
                  <div key={`${card.year}-${month.index}`} className="rounded-2xl border border-line bg-surface px-4 py-3">
                    <p className="text-xs font-semibold text-ink-muted">{month.name}</p>
                    <p className="mt-2 text-sm font-bold text-ink">{formatCurrency(month.value)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

function LedgerDetailsTable({
  rows,
  compact = false,
}: {
  rows: CombinedLedgerRow[]
  compact?: boolean
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-line bg-surface p-5 text-sm text-ink-soft">
        لا توجد حركات مالية أو مصروفات قديمة مسجلة لهذا الحساب.
      </div>
    )
  }

  const visibleRows = compact ? rows.slice(0, 6) : rows

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full text-right">
          <thead className="bg-surface-subtle">
            <tr className="text-xs font-semibold text-ink-soft">
              <th className="px-4 py-3">التاريخ</th>
              <th className="px-4 py-3">رقم العملية</th>
              <th className="px-4 py-3">رقم القيد</th>
              <th className="px-4 py-3">البيان</th>
              <th className="px-4 py-3">مدين</th>
              <th className="px-4 py-3">دائن</th>
              <th className="px-4 py-3">الرصيد</th>
              <th className="px-4 py-3">المصدر</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.key} className="border-t border-line text-sm text-ink">
                <td className="px-4 py-3">{formatDate(row.date)}</td>
                <td className="px-4 py-3 font-tabular text-ink-soft">{row.operation_number || '—'}</td>
                <td className="px-4 py-3 font-tabular text-ink-soft">{row.entry_number || '—'}</td>
                <td className="px-4 py-3">{row.description || '—'}</td>
                <td className="px-4 py-3 font-tabular text-action-primary">{formatCurrency(row.debit)}</td>
                <td className="px-4 py-3 font-tabular text-emerald-700">{formatCurrency(row.credit)}</td>
                <td className="px-4 py-3 font-tabular font-semibold text-ink">{formatCurrency(row.balance)}</td>
                <td className="px-4 py-3 text-xs text-ink-muted">{row.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {compact && rows.length > visibleRows.length ? (
        <div className="border-t border-line bg-surface-subtle px-4 py-3 text-xs font-semibold text-ink-muted">
          يتم عرض آخر {formatNumber(visibleRows.length, 0)} حركات من أصل {formatNumber(rows.length, 0)}.
        </div>
      ) : null}
    </div>
  )
}

function AccountDialog({
  open,
  onClose,
  state,
  tree,
  onSubmit,
  isPending,
}: {
  open: boolean
  onClose: () => void
  state: AccountDialogState | null
  tree: NurseryExpenseAccountNode[]
  onSubmit: (payload: NurseryExpenseAccountPayload, accountId?: number) => Promise<void>
  isPending: boolean
}) {
  const [submitError, setSubmitError] = useState('')
  const disabledIds = useMemo(
    () => (state?.mode === 'edit' && state.account ? collectDescendantIds(state.account) : new Set<number>()),
    [state]
  )
  const parentOptions = useMemo(() => buildAccountOptions(tree, disabledIds), [tree, disabledIds])

  const form = useForm<AccountFormInput, undefined, AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: state?.mode === 'edit' ? state.account.name : '',
      parent_id: state?.parentId ?? null,
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  const title =
    state?.mode === 'edit'
      ? 'تعديل حساب'
      : state?.mode === 'create-child'
        ? 'إضافة حساب فرعي'
        : 'إضافة حساب رئيسي'

  const submit = handleSubmit(async (values) => {
    try {
      setSubmitError('')
      await onSubmit(
        {
          name: values.name,
          parent_id: values.parent_id,
        },
        state?.mode === 'edit' ? state.account.id : undefined
      )
      onClose()
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-2xl">
      <div className="rounded-[2rem] border border-line bg-surface shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-ink-soft">
              أنشئ طبقة محاسبية واضحة للشجرة المحلية أو أعد ربط الحساب بمستوى آخر.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-line bg-surface-subtle p-2 text-ink-soft active:scale-[0.98] transition-all duration-200 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-6 py-6">
          {submitError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <div>
            <label htmlFor="account-name" className="mb-2 block text-sm font-semibold text-ink-soft">
              اسم الحساب
            </label>
            <input
              id="account-name"
              {...register('name')}
              placeholder="مثال: مصروف صالات الإكثار"
              className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm text-ink outline-none focus:ring-2 focus:ring-action-primary/20 ${
                errors.name ? 'border-red-600' : 'border-line'
              }`}
            />
            {errors.name ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.name.message}</p> : null}
          </div>

          <div>
            <label htmlFor="account-parent" className="mb-2 block text-sm font-semibold text-ink-soft">
              الحساب الأم
            </label>
            <select
              id="account-parent"
              {...register('parent_id', {
                setValueAs: (value) => (value ? Number(value) : null),
              })}
              className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm text-ink outline-none focus:ring-2 focus:ring-action-primary/20 ${
                errors.parent_id ? 'border-red-600' : 'border-line'
              }`}
            >
              <option value="">بدون حساب أم</option>
              {parentOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.parent_id ? (
              <p className="mt-2 text-xs font-semibold text-red-600">{errors.parent_id.message}</p>
            ) : (
              <p className="mt-2 text-xs text-ink-muted">يمكنك ترك الحقل فارغاً لإنشاء حساب رئيسي جديد.</p>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-soft active:scale-[0.98] transition-all duration-200 hover:border-line-strong hover:text-ink"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-action-primary px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.98] transition-all duration-200 hover:bg-action-primary-hover disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {state?.mode === 'edit' ? 'حفظ التعديلات' : 'حفظ الحساب'}
            </button>
          </div>
        </form>
      </div>
    </AppDialog>
  )
}

function TransactionDialog({
  open,
  onClose,
  account,
  onSubmit,
  isPending,
}: {
  open: boolean
  onClose: () => void
  account: NurseryExpenseAccountNode | null
  onSubmit: (accountId: number, payload: NurseryExpenseTransactionPayload) => Promise<void>
  isPending: boolean
}) {
  const [submitError, setSubmitError] = useState('')

  const form = useForm<TransactionFormInput, undefined, TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      operation_number: '',
      entry_number: '',
      expense_date: todayIso(),
      description: '',
      debit_amount: 0,
      credit_amount: 0,
    },
  })

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form

  const debitAmount = useWatch({ control, name: 'debit_amount' }) ?? 0
  const creditAmount = useWatch({ control, name: 'credit_amount' }) ?? 0
  const computedBalance = Math.abs(Number(debitAmount || 0) - Number(creditAmount || 0))
  const balanceType = Number(debitAmount || 0) - Number(creditAmount || 0) >= 0 ? 'مدين' : 'دائن'

  const submit = handleSubmit(async (values) => {
    if (!account) return

    try {
      setSubmitError('')
      await onSubmit(account.id, {
        operation_number: values.operation_number?.trim() || null,
        entry_number: values.entry_number?.trim() || null,
        expense_date: values.expense_date,
        description: values.description?.trim() || null,
        debit_amount: values.debit_amount,
        credit_amount: values.credit_amount || null,
      })
      onClose()
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-4xl">
      <div className="rounded-[2rem] border border-line bg-surface shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-ink">إضافة حركة مالية</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {account ? `الحساب المستهدف: ${account.name}` : 'حدد حساباً من الشجرة أولاً'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-line bg-surface-subtle p-2 text-ink-soft active:scale-[0.98] transition-all duration-200 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-6 py-6">
          {submitError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="operation-number" className="mb-2 block text-sm font-semibold text-ink-soft">
                رقم العملية
              </label>
              <input
                id="operation-number"
                {...register('operation_number')}
                placeholder="OP-2026-001"
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.operation_number ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.operation_number ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.operation_number.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="entry-number" className="mb-2 block text-sm font-semibold text-ink-soft">
                رقم القيد
              </label>
              <input
                id="entry-number"
                {...register('entry_number')}
                placeholder="JV-1184"
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.entry_number ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.entry_number ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.entry_number.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[1fr_1.4fr]">
            <div>
              <label htmlFor="expense-date" className="mb-2 block text-sm font-semibold text-ink-soft">
                التاريخ
              </label>
              <input
                id="expense-date"
                type="date"
                {...register('expense_date')}
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.expense_date ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.expense_date ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.expense_date.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="transaction-description" className="mb-2 block text-sm font-semibold text-ink-soft">
                البيان
              </label>
              <input
                id="transaction-description"
                {...register('description')}
                placeholder="تفاصيل القيد أو البيان المالي"
                className="h-12 w-full rounded-2xl border border-line bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label htmlFor="debit-amount" className="mb-2 block text-sm font-semibold text-ink-soft">
                مدين
              </label>
              <input
                id="debit-amount"
                type="number"
                step="0.01"
                min="0"
                {...register('debit_amount')}
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.debit_amount ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.debit_amount ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.debit_amount.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="credit-amount" className="mb-2 block text-sm font-semibold text-ink-soft">
                دائن
              </label>
              <input
                id="credit-amount"
                type="number"
                step="0.01"
                min="0"
                {...register('credit_amount')}
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.credit_amount ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.credit_amount ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.credit_amount.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="balance-preview" className="mb-2 block text-sm font-semibold text-ink-soft">
                الرصيد المحسوب
              </label>
              <div
                id="balance-preview"
                className="flex h-12 items-center justify-between rounded-2xl border border-line bg-surface-subtle px-4 text-sm"
              >
                <span className="font-tabular font-bold text-ink">{formatCurrency(computedBalance)}</span>
                <span className="rounded-full bg-[rgba(194,65,12,0.08)] px-2.5 py-1 text-xs font-semibold text-action-primary">
                  {balanceType}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-soft active:scale-[0.98] transition-all duration-200 hover:border-line-strong hover:text-ink"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending || !account}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-action-primary px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.98] transition-all duration-200 hover:bg-action-primary-hover disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgePlus className="h-4 w-4" />}
              حفظ الحركة
            </button>
          </div>
        </form>
      </div>
    </AppDialog>
  )
}

function FileDropzone({
  file,
  error,
  description,
  isDragActive,
  onDragActiveChange,
  onSelectFile,
}: {
  file: File | null
  error?: string
  description: React.ReactNode
  isDragActive: boolean
  onDragActiveChange: (value: boolean) => void
  onSelectFile: (files: FileList | null) => void
}) {
  return (
    <div
      className="relative rounded-[1.75rem] border border-dashed border-line bg-surface-subtle p-5"
      onDragEnter={(event) => {
        event.preventDefault()
        onDragActiveChange(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        onDragActiveChange(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        onDragActiveChange(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        onDragActiveChange(false)
        onSelectFile(event.dataTransfer.files)
      }}
    >
      <div
        className={`absolute inset-2 rounded-[1.4rem] border-2 border-dashed transition-all duration-200 ${
          isDragActive ? 'border-action-primary bg-[rgba(194,65,12,0.06)]' : 'border-transparent'
        }`}
      />
      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-bold text-ink">منطقة رفع Excel التفاعلية</p>
            <div className="mt-1 text-sm leading-6 text-ink-soft">{description}</div>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(194,65,12,0.08)] text-action-primary">
            <Upload className="h-5 w-5" />
          </span>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-line bg-surface px-6 py-8 text-center active:scale-[0.98] transition-all duration-200 hover:border-line-strong hover:bg-white">
          <ArrowUpFromLine className="h-8 w-8 text-action-primary" />
          <p className="mt-4 text-sm font-semibold text-ink">اسحب الملف هنا أو اضغط للاختيار</p>
          <p className="mt-2 text-xs text-ink-muted">الامتدادات المقبولة: `.xlsx` و `.xls` بحد أقصى 10MB</p>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(event) => onSelectFile(event.target.files)}
          />
        </label>

        <div className="rounded-2xl border border-line bg-surface px-4 py-3">
          <p className="text-xs font-semibold text-ink-muted">حالة الملف</p>
          <p className="mt-1 text-sm font-semibold text-ink">{file ? file.name : 'لم يتم اختيار أي ملف بعد'}</p>
        </div>

        {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
      </div>
    </div>
  )
}

function UploadExpenseFileDialog({
  open,
  onClose,
  account,
  onSubmit,
  isPending,
}: {
  open: boolean
  onClose: () => void
  account: NurseryExpenseAccountNode | null
  onSubmit: (accountId: number, file: File) => Promise<void>
  isPending: boolean
}) {
  const [submitError, setSubmitError] = useState('')
  const [isDragActive, setIsDragActive] = useState(false)

  const form = useForm<ExcelUploadFormInput, undefined, ExcelUploadFormValues>({
    resolver: zodResolver(excelUploadSchema),
    defaultValues: { file: undefined },
  })

  const {
    setValue,
    handleSubmit,
    formState: { errors },
  } = form

  const fileList = useWatch({ control: form.control, name: 'file' })
  const selectedFile = fileList?.item(0) ?? null

  const submit = handleSubmit(async (values) => {
    if (!account) return
    const fileList = values.file
    if (!fileList) return
    const file = fileList.item(0)
    if (!file) return

    try {
      setSubmitError('')
      await onSubmit(account.id, file)
      onClose()
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-4xl">
      <div className="rounded-[2rem] border border-line bg-surface shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-ink">رفع بيانات إكسيل للحساب</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {account ? `سيتم ربط الملف مباشرة بالحساب: ${account.name}` : 'حدد حساباً أولاً'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-line bg-surface-subtle p-2 text-ink-soft active:scale-[0.98] transition-all duration-200 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-6 py-6">
          {submitError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <FileDropzone
            file={selectedFile}
            error={errors.file?.message}
            isDragActive={isDragActive}
            onDragActiveChange={setIsDragActive}
            onSelectFile={(files) => {
              setValue('file', files ?? undefined, { shouldValidate: true })
            }}
            description={
              <div className="space-y-1">
                <p>سيتم تحليل الملف وفق ترتيب الأعمدة المعتمد:</p>
                <p className="text-xs text-ink-muted">
                  رقم العملية، رقم القيد، التاريخ، البيان، مدين، دائن، الرصيد، نوع الرصيد.
                </p>
              </div>
            }
          />

          <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-soft active:scale-[0.98] transition-all duration-200 hover:border-line-strong hover:text-ink"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending || !account}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-action-primary px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.98] transition-all duration-200 hover:bg-action-primary-hover disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              رفع ومعالجة الملف
            </button>
          </div>
        </form>
      </div>
    </AppDialog>
  )
}

function AssetDialog({
  open,
  onClose,
  asset,
  categories,
  accounts,
  onSubmit,
  isPending,
}: {
  open: boolean
  onClose: () => void
  asset: NurseryAsset | null
  categories: NurseryAssetCategory[]
  accounts: NurseryExpenseAccount[]
  onSubmit: (payload: NurseryAssetPayload, assetId?: number) => Promise<void>
  isPending: boolean
}) {
  const [submitError, setSubmitError] = useState('')

  const form = useForm<AssetFormInput, undefined, AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: asset?.name ?? '',
      code: asset?.code ?? '',
      document_number: asset?.document_number ?? '',
      purchase_date: asset?.purchase_date ?? todayIso(),
      purchase_value: asset?.purchase_value ?? 0,
      asset_type: asset?.asset_type ?? 'fixed',
      asset_account_number: asset?.asset_account_number ?? '',
      category_id: asset?.category_id ?? null,
      expense_account_id: asset?.expense_account_id ?? null,
      expense_account_name: asset?.expense_account_name ?? '',
      expense_account_number: asset?.expense_account_number ?? '',
      account_name: asset?.account_name ?? '',
    },
  })

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = form

  const linkedExpenseAccountId = useWatch({ control, name: 'expense_account_id' })

  useEffect(() => {
    if (!linkedExpenseAccountId) return
    const linkedAccount = accounts.find((accountItem) => accountItem.id === linkedExpenseAccountId)
    if (!linkedAccount) return

    setValue('expense_account_name', linkedAccount.name, { shouldDirty: true })
  }, [accounts, linkedExpenseAccountId, setValue])

  const submit = handleSubmit(async (values) => {
    try {
      setSubmitError('')
      await onSubmit(
        {
          name: values.name,
          code: values.code?.trim() || null,
          document_number: values.document_number?.trim() || null,
          purchase_date: values.purchase_date,
          purchase_value: values.purchase_value,
          asset_type: values.asset_type,
          asset_account_number: values.asset_account_number?.trim() || null,
          category_id: values.category_id,
          expense_account_id: values.expense_account_id,
          expense_account_name: values.expense_account_name?.trim() || null,
          expense_account_number: values.expense_account_number?.trim() || null,
          account_name: values.account_name?.trim() || null,
        },
        asset?.id
      )
      onClose()
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-6xl">
      <div className="rounded-[2rem] border border-line bg-surface shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-ink">{asset ? 'تعديل أصل مشتلي' : 'إضافة أصل جديد'}</h2>
            <p className="mt-1 text-sm text-ink-soft">
              اربط تفاصيل الأصل مع نوع حسابه وتصنيفه وحساب المصروف المحلي للمشتل.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-line bg-surface-subtle p-2 text-ink-soft active:scale-[0.98] transition-all duration-200 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-6 py-6">
          {submitError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label htmlFor="asset-name" className="mb-2 block text-sm font-semibold text-ink-soft">
                اسم الأصل
              </label>
              <input
                id="asset-name"
                {...register('name')}
                placeholder="مثال: بيت شبكي 02"
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.name ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.name ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.name.message}</p> : null}
            </div>

            <div>
              <label htmlFor="asset-code" className="mb-2 block text-sm font-semibold text-ink-soft">
                رمز الأصل
              </label>
              <input
                id="asset-code"
                {...register('code')}
                placeholder="NSY-FA-002"
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.code ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.code ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.code.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label htmlFor="asset-document" className="mb-2 block text-sm font-semibold text-ink-soft">
                رقم المستند
              </label>
              <input
                id="asset-document"
                {...register('document_number')}
                placeholder="INV-8732"
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.document_number ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.document_number ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.document_number.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="asset-date" className="mb-2 block text-sm font-semibold text-ink-soft">
                تاريخ الشراء
              </label>
              <input
                id="asset-date"
                type="date"
                {...register('purchase_date')}
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.purchase_date ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.purchase_date ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.purchase_date.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div>
              <label htmlFor="purchase-value" className="mb-2 block text-sm font-semibold text-ink-soft">
                قيمة الشراء
              </label>
              <input
                id="purchase-value"
                type="number"
                step="0.01"
                min="0"
                {...register('purchase_value')}
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.purchase_value ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.purchase_value ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.purchase_value.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="asset-type" className="mb-2 block text-sm font-semibold text-ink-soft">
                حساب الأصل
              </label>
              <select
                id="asset-type"
                {...register('asset_type')}
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.asset_type ? 'border-red-600' : 'border-line'
                }`}
              >
                <option value="fixed">ثابت</option>
                <option value="current">متداول</option>
              </select>
              {errors.asset_type ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.asset_type.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="asset-account-number" className="mb-2 block text-sm font-semibold text-ink-soft">
                رقم حساب الأصل
              </label>
              <input
                id="asset-account-number"
                {...register('asset_account_number')}
                placeholder="102013001"
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.asset_account_number ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.asset_account_number ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.asset_account_number.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label htmlFor="asset-category" className="mb-2 block text-sm font-semibold text-ink-soft">
                تصنيف الأصل
              </label>
              <select
                id="asset-category"
                {...register('category_id', {
                  setValueAs: (value) => (value ? Number(value) : null),
                })}
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.category_id ? 'border-red-600' : 'border-line'
                }`}
              >
                <option value="">بدون تصنيف</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.category_id.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="expense-account-id" className="mb-2 block text-sm font-semibold text-ink-soft">
                ربط حساب المصروف
              </label>
              <select
                id="expense-account-id"
                {...register('expense_account_id', {
                  setValueAs: (value) => (value ? Number(value) : null),
                })}
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.expense_account_id ? 'border-red-600' : 'border-line'
                }`}
              >
                <option value="">بدون ربط مباشر</option>
                {accounts.map((accountItem) => (
                  <option key={accountItem.id} value={accountItem.id}>
                    {accountItem.name}
                  </option>
                ))}
              </select>
              {errors.expense_account_id ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.expense_account_id.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div>
              <label htmlFor="expense-account-name" className="mb-2 block text-sm font-semibold text-ink-soft">
                حساب المصروف
              </label>
              <input
                id="expense-account-name"
                {...register('expense_account_name')}
                placeholder="مثال: مشتل صبارة صالات"
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.expense_account_name ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.expense_account_name ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.expense_account_name.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="expense-account-number" className="mb-2 block text-sm font-semibold text-ink-soft">
                رقم الحساب
              </label>
              <input
                id="expense-account-number"
                {...register('expense_account_number')}
                placeholder="103006"
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.expense_account_number ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.expense_account_number ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.expense_account_number.message}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="account-name-ledger" className="mb-2 block text-sm font-semibold text-ink-soft">
                اسم الحساب
              </label>
              <input
                id="account-name-ledger"
                {...register('account_name')}
                placeholder="إنشاء مشتل صبارة"
                className={`h-12 w-full rounded-2xl border bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20 ${
                  errors.account_name ? 'border-red-600' : 'border-line'
                }`}
              />
              {errors.account_name ? (
                <p className="mt-2 text-xs font-semibold text-red-600">{errors.account_name.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-soft active:scale-[0.98] transition-all duration-200 hover:border-line-strong hover:text-ink"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-action-primary px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.98] transition-all duration-200 hover:bg-action-primary-hover disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package2 className="h-4 w-4" />}
              {asset ? 'حفظ تعديلات الأصل' : 'حفظ الأصل'}
            </button>
          </div>
        </form>
      </div>
    </AppDialog>
  )
}

function ImportAssetsDialog({
  open,
  onClose,
  onSubmit,
  isPending,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (file: File) => Promise<void>
  isPending: boolean
}) {
  const [submitError, setSubmitError] = useState('')
  const [isDragActive, setIsDragActive] = useState(false)
  const form = useForm<ExcelUploadFormInput, undefined, ExcelUploadFormValues>({
    resolver: zodResolver(excelUploadSchema),
    defaultValues: { file: undefined },
  })

  const fileList = useWatch({ control: form.control, name: 'file' })
  const selectedFile = fileList?.item(0) ?? null

  const submit = form.handleSubmit(async (values) => {
    const fileList = values.file
    if (!fileList) return
    const file = fileList.item(0)
    if (!file) return

    try {
      setSubmitError('')
      await onSubmit(file)
      onClose()
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-4xl">
      <div className="rounded-[2rem] border border-line bg-surface shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-ink">رفع بيانات إكسيل للأصول</h2>
            <p className="mt-1 text-sm text-ink-soft">
              استخدم النموذج الرسمي ثم ارفع الملف ليتم استيراد السجل الكامل دفعة واحدة.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-line bg-surface-subtle p-2 text-ink-soft active:scale-[0.98] transition-all duration-200 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-6 py-6">
          {submitError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <FileDropzone
            file={selectedFile}
            error={form.formState.errors.file?.message}
            isDragActive={isDragActive}
            onDragActiveChange={setIsDragActive}
            onSelectFile={(files) => {
              form.setValue('file', files ?? undefined, { shouldValidate: true })
            }}
            description={
              <div className="space-y-1">
                <p>النموذج المستورد يجب أن يحتوي على بيانات الأصل حسب الهيكل المعتمد من الواجهة الحالية.</p>
                <p className="text-xs text-ink-muted">الاسم، الرمز، المستند، التاريخ، القيمة، ونطاق الحسابات.</p>
              </div>
            }
          />

          <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-soft active:scale-[0.98] transition-all duration-200 hover:border-line-strong hover:text-ink"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-action-primary px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.98] transition-all duration-200 hover:bg-action-primary-hover disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpFromLine className="h-4 w-4" />}
              رفع واستيراد البيانات
            </button>
          </div>
        </form>
      </div>
    </AppDialog>
  )
}

function BulkCategoryDialog({
  open,
  onClose,
  categories,
  count,
  onSubmit,
  isPending,
}: {
  open: boolean
  onClose: () => void
  categories: NurseryAssetCategory[]
  count: number
  onSubmit: (categoryId: number | null) => Promise<void>
  isPending: boolean
}) {
  const [submitError, setSubmitError] = useState('')
  const form = useForm<BulkCategoryFormInput, undefined, BulkCategoryFormValues>({
    resolver: zodResolver(bulkCategorySchema),
    defaultValues: { category_id: null },
  })

  const submit = form.handleSubmit(async (values) => {
    try {
      setSubmitError('')
      await onSubmit(values.category_id)
      onClose()
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    }
  })

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-2xl">
      <div className="rounded-[2rem] border border-line bg-surface shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-ink">تحديث تصنيف الأصول المحددة</h2>
            <p className="mt-1 text-sm text-ink-soft">
              سيتم تطبيق التصنيف على {formatNumber(count, 0)} أصل أو إزالته بالكامل.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-line bg-surface-subtle p-2 text-ink-soft active:scale-[0.98] transition-all duration-200 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-6 py-6">
          {submitError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <div>
            <label htmlFor="bulk-category" className="mb-2 block text-sm font-semibold text-ink-soft">
              التصنيف الجديد
            </label>
            <select
              id="bulk-category"
              {...form.register('category_id', {
                setValueAs: (value) => (value ? Number(value) : null),
              })}
              className="h-12 w-full rounded-2xl border border-line bg-surface-muted px-4 text-sm outline-none focus:ring-2 focus:ring-action-primary/20"
            >
              <option value="">بدون تصنيف</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-soft active:scale-[0.98] transition-all duration-200 hover:border-line-strong hover:text-ink"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-action-primary px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.98] transition-all duration-200 hover:bg-action-primary-hover disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              تنفيذ العملية
            </button>
          </div>
        </form>
      </div>
    </AppDialog>
  )
}

function DetailsDialog({
  open,
  onClose,
  account,
  details,
  isLoading,
}: {
  open: boolean
  onClose: () => void
  account: NurseryExpenseAccountNode | null
  details: NurseryExpenseDetails | undefined
  isLoading: boolean
}) {
  const rows = useMemo(() => combineLedgerRows(details), [details])

  return (
    <AppDialog open={open} onClose={onClose} panelClassName="max-w-[90rem]">
      <div className="rounded-[2rem] border border-line bg-surface shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-ink">تفاصيل الحساب المالي</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {account ? `عرض تفصيلي للحساب: ${account.name}` : 'اختر حساباً لعرض التفاصيل'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-line bg-surface-subtle p-2 text-ink-soft active:scale-[0.98] transition-all duration-200 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          {isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-subtle px-4 py-3 text-sm text-ink-soft">
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري تحميل التفاصيل الشهرية والقيود...
            </div>
          ) : null}

          {account ? (
            <>
              <section className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
                <div className="rounded-[1.75rem] border border-line bg-surface-subtle p-5">
                  <p className="text-xs font-semibold text-ink-muted">إجمالي مباشر</p>
                  <p className="mt-2 text-2xl font-bold text-ink">{formatCurrency(account.direct_amount)}</p>
                  <p className="mt-4 text-xs font-semibold text-ink-muted">إجمالي شامل بالفروع</p>
                  <p className="mt-2 text-2xl font-bold text-action-primary">{formatCurrency(account.total_amount)}</p>
                </div>
                <YearlySummaryLane details={details} fallbackYearlyTotals={account.yearly_totals} />
              </section>

              <LedgerDetailsTable rows={rows} />
            </>
          ) : null}
        </div>
      </div>
    </AppDialog>
  )
}

function AccountTreeNodeCard({
  node,
  depth,
  selectedAccountId,
  expandedIds,
  draggingAccountId,
  dragOverAccountId,
  onToggleExpand,
  onSelect,
  onOpenDetails,
  onAddChild,
  onEdit,
  onDelete,
  onTogglePin,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  node: NurseryExpenseAccountNode
  depth: number
  selectedAccountId: number | null
  expandedIds: Set<number>
  draggingAccountId: number | null
  dragOverAccountId: number | null
  onToggleExpand: (id: number) => void
  onSelect: (id: number) => void
  onOpenDetails: (id: number) => void
  onAddChild: (node: NurseryExpenseAccountNode) => void
  onEdit: (node: NurseryExpenseAccountNode) => void
  onDelete: (node: NurseryExpenseAccountNode) => void
  onTogglePin: (node: NurseryExpenseAccountNode) => void
  onDragStart: (id: number) => void
  onDragEnd: () => void
  onDragOver: (id: number, event: React.DragEvent<HTMLDivElement>) => void
  onDrop: (id: number, event: React.DragEvent<HTMLDivElement>) => void
}) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedAccountId === node.id
  const isDragOver = dragOverAccountId === node.id
  const childTotal = Math.max(0, node.total_amount - node.direct_amount)

  return (
    <div className="space-y-3">
      <div
        draggable
        onDragStart={() => onDragStart(node.id)}
        onDragEnd={onDragEnd}
        onDragOver={(event) => onDragOver(node.id, event)}
        onDrop={(event) => onDrop(node.id, event)}
        className={`rounded-[1.5rem] border bg-surface px-4 py-4 shadow-sm transition-all duration-200 ${
          isSelected ? 'border-action-primary bg-[rgba(194,65,12,0.03)]' : 'border-line hover:border-line-strong'
        } ${isDragOver ? 'border-action-primary ring-2 ring-action-primary/20' : ''} ${
          draggingAccountId === node.id ? 'opacity-60' : ''
        }`}
        style={{ marginRight: `${depth * 20}px` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => (hasChildren ? onToggleExpand(node.id) : onSelect(node.id))}
                className="mt-0.5 rounded-xl border border-line bg-surface-subtle p-2 text-ink-soft active:scale-[0.98] transition-all duration-200 hover:text-ink"
              >
                {hasChildren ? (
                  <ChevronDown className={`h-4 w-4 transition-all duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onSelect(node.id)}
                className="min-w-0 flex-1 text-right active:scale-[0.98] transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-ink-muted" />
                  <h3 className="truncate text-sm font-bold text-ink">{node.name}</h3>
                  <span className="rounded-full bg-surface-subtle px-2 py-1 text-[11px] font-semibold text-ink-muted">
                    مستوى {depth + 1}
                  </span>
                  {node.is_pinned ? (
                    <span className="rounded-full bg-[rgba(194,65,12,0.08)] px-2 py-1 text-[11px] font-semibold text-action-primary">
                      مثبت
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-2xl border border-line bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-soft">
                    مباشر: {formatCurrency(node.direct_amount)}
                  </span>
                  <span className="rounded-2xl border border-line bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-soft">
                    فروع: {formatCurrency(childTotal)}
                  </span>
                  <span className="rounded-2xl border border-action-primary/20 bg-[rgba(194,65,12,0.08)] px-3 py-2 text-xs font-semibold text-action-primary">
                    الإجمالي: {formatCurrency(node.total_amount)}
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onTogglePin(node)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold active:scale-[0.98] transition-all duration-200 ${
                node.is_pinned
                  ? 'border-action-primary/20 bg-[rgba(194,65,12,0.08)] text-action-primary hover:bg-[rgba(194,65,12,0.12)]'
                  : 'border-line bg-surface-subtle text-ink-soft hover:text-ink'
              }`}
            >
              {node.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              {node.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
            </button>
            <button
              type="button"
              onClick={() => onOpenDetails(node.id)}
              className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-line bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-soft active:scale-[0.98] transition-all duration-200 hover:text-ink"
            >
              <Rows3 className="h-4 w-4" />
              التفاصيل
            </button>
            <button
              type="button"
              onClick={() => onAddChild(node)}
              className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-line bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-soft active:scale-[0.98] transition-all duration-200 hover:text-ink"
            >
              <Plus className="h-4 w-4" />
              فرعي
            </button>
            <button
              type="button"
              onClick={() => onEdit(node)}
              className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-line bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-soft active:scale-[0.98] transition-all duration-200 hover:text-ink"
            >
              <PencilLine className="h-4 w-4" />
              تعديل
            </button>
            <button
              type="button"
              onClick={() => onDelete(node)}
              className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 active:scale-[0.98] transition-all duration-200 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </button>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded ? (
        <div className="space-y-3">
          {node.children.map((child) => (
            <AccountTreeNodeCard
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedAccountId={selectedAccountId}
              expandedIds={expandedIds}
              draggingAccountId={draggingAccountId}
              dragOverAccountId={dragOverAccountId}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onOpenDetails={onOpenDetails}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onTogglePin={onTogglePin}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function TreeTab({
  data,
  selectedAccount,
  details,
  detailsLoading,
  selectedAccountId,
  expandedIds,
  draggingAccountId,
  dragOverAccountId,
  onToggleExpand,
  onSelectAccount,
  onOpenDetails,
  onCreateRoot,
  onAddChild,
  onEditAccount,
  onDeleteAccount,
  onTogglePin,
  onOpenTransaction,
  onOpenUpload,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  data: NurseryExpenseBootstrap
  selectedAccount: NurseryExpenseAccountNode | null
  details: NurseryExpenseDetails | undefined
  detailsLoading: boolean
  selectedAccountId: number | null
  expandedIds: Set<number>
  draggingAccountId: number | null
  dragOverAccountId: number | null
  onToggleExpand: (id: number) => void
  onSelectAccount: (id: number) => void
  onOpenDetails: (id: number) => void
  onCreateRoot: () => void
  onAddChild: (node: NurseryExpenseAccountNode) => void
  onEditAccount: (node: NurseryExpenseAccountNode) => void
  onDeleteAccount: (node: NurseryExpenseAccountNode) => void
  onTogglePin: (node: NurseryExpenseAccountNode) => void
  onOpenTransaction: () => void
  onOpenUpload: () => void
  onDragStart: (id: number) => void
  onDragEnd: () => void
  onDragOver: (id: number, event: React.DragEvent<HTMLDivElement>) => void
  onDrop: (id: number, event: React.DragEvent<HTMLDivElement>) => void
}) {
  const rows = useMemo(() => combineLedgerRows(details), [details])

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-4">
        <StatCard
          icon={FolderTree}
          title="إجمالي الحسابات"
          value={formatNumber(data.summary.accounts_count, 0)}
          helper="عدد العقد والحسابات داخل شجرة مصروفات المشتل."
          tone="slate"
        />
        <StatCard
          icon={Pin}
          title="الحسابات المثبتة"
          value={formatNumber(data.summary.pinned_count, 0)}
          helper="حسابات المتابعة السريعة المثبتة في شريط الملخص."
          tone="clay"
        />
        <StatCard
          icon={CircleDollarSign}
          title="إجمالي المصروفات"
          value={formatCurrency(data.summary.expenses_total)}
          helper="إجمالي المصروفات والتكاليف المسجلة ضمن الدفتر المحلي."
          tone="emerald"
        />
        <StatCard
          icon={Package2}
          title="الأصول المرتبطة"
          value={formatNumber(data.summary.assets_count, 0)}
          helper="عدد الأصول التي تعتمد على حسابات مصروفات أو أصول المشتل."
          tone="amber"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.85fr_1fr]">
        <div className="space-y-5">
          {data.pinned_accounts.length > 0 ? (
            <div className="rounded-[2rem] border border-line bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-ink">شريط الحسابات المثبتة</h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    نقاط مراقبة مختصرة للحسابات الأكثر حساسية في مصروفات المشتل.
                  </p>
                </div>
                <HeaderActionButton icon={Plus} label="إضافة حساب رئيسي" onClick={onCreateRoot} />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {data.pinned_accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => onSelectAccount(account.id)}
                    className={`rounded-[1.5rem] border p-4 text-right active:scale-[0.98] transition-all duration-200 ${
                      selectedAccountId === account.id
                        ? 'border-action-primary bg-[rgba(194,65,12,0.08)]'
                        : 'border-line bg-surface-subtle hover:border-line-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink">{account.name}</p>
                        <p className="mt-2 text-lg font-bold text-action-primary">
                          {formatCurrency(account.total_amount)}
                        </p>
                      </div>
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-action-primary">
                        <Pin className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[2rem] border border-line bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <h2 className="text-lg font-bold text-ink">شجرة الحسابات التفاعلية</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  اسحب الحسابات لإعادة هيكلتها، وافتح العقد لقراءة الإجماليات المباشرة وتكاليف الفروع.
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-muted">
                السحب والإفلات مفعل لنقل الحسابات بين المستويات
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {data.accounts.length === 0 ? (
                <EmptyState
                  icon={FolderTree}
                  title="لا توجد حسابات مصروفات مسجلة"
                  description="ابدأ بإضافة أول حساب رئيسي لتأسيس شجرة تكاليف المشتل المعزولة."
                  action={<HeaderActionButton icon={Plus} label="إضافة حساب رئيسي" onClick={onCreateRoot} />}
                />
              ) : (
                data.accounts.map((node) => (
                  <AccountTreeNodeCard
                    key={node.id}
                    node={node}
                    depth={0}
                    selectedAccountId={selectedAccountId}
                    expandedIds={expandedIds}
                    draggingAccountId={draggingAccountId}
                    dragOverAccountId={dragOverAccountId}
                    onToggleExpand={onToggleExpand}
                    onSelect={onSelectAccount}
                    onOpenDetails={onOpenDetails}
                    onAddChild={onAddChild}
                    onEdit={onEditAccount}
                    onDelete={onDeleteAccount}
                    onTogglePin={onTogglePin}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[2rem] border border-line bg-surface p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink">
                  {selectedAccount ? selectedAccount.name : 'لوحة المتابعة الشهرية'}
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {selectedAccount
                    ? 'تفصيل مباشر للحساب المحدد مع قراءة سنوية وشهرية متدرجة.'
                    : 'اختر حساباً من الشجرة لعرض الملخصات الشهرية وسجل الحركات.'}
                </p>
              </div>
              {selectedAccount ? (
                <div className="flex flex-wrap gap-2">
                  <HeaderActionButton icon={BadgePlus} label="إضافة حركة" onClick={onOpenTransaction} />
                  <HeaderActionButton icon={Upload} label="رفع إكسيل" tone="secondary" onClick={onOpenUpload} />
                </div>
              ) : null}
            </div>

            {selectedAccount ? (
              <div className="mt-5 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-line bg-surface-subtle p-4">
                    <p className="text-xs font-semibold text-ink-muted">القيمة المباشرة</p>
                    <p className="mt-2 text-xl font-bold text-ink">{formatCurrency(selectedAccount.direct_amount)}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-line bg-surface-subtle p-4">
                    <p className="text-xs font-semibold text-ink-muted">الإجمالي الشامل</p>
                    <p className="mt-2 text-xl font-bold text-action-primary">
                      {formatCurrency(selectedAccount.total_amount)}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-ink">المسار السنوي والشهري</p>
                    {detailsLoading ? (
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-ink-muted">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        جاري التحديث
                      </span>
                    ) : null}
                  </div>
                  <YearlySummaryLane details={details} fallbackYearlyTotals={selectedAccount.yearly_totals} />
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-ink">آخر الحركات المالية</p>
                    <button
                      type="button"
                      onClick={() => onOpenDetails(selectedAccount.id)}
                      className="text-xs font-semibold text-action-primary active:scale-[0.98] transition-all duration-200 hover:text-action-primary-hover"
                    >
                      عرض السجل الكامل
                    </button>
                  </div>
                  <LedgerDetailsTable rows={rows} compact />
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState
                  icon={CalendarDays}
                  title="حدد حساباً من الشجرة"
                  description="ستظهر هنا بطاقة الملخص السنوي والشهري، مع آخر الحركات والخيارات التشغيلية للحساب المحدد."
                />
              </div>
            )}
          </section>
        </aside>
      </section>
    </div>
  )
}

function AssetsTab({
  data,
  selectedAssetIds,
  onToggleAsset,
  onToggleAllAssets,
  onOpenCreateAsset,
  onOpenImport,
  onOpenBulkCategory,
  onEditAsset,
  onDeleteAsset,
  onBulkDelete,
}: {
  data: NurseryExpenseBootstrap
  selectedAssetIds: Set<number>
  onToggleAsset: (assetId: number) => void
  onToggleAllAssets: (checked: boolean) => void
  onOpenCreateAsset: () => void
  onOpenImport: () => void
  onOpenBulkCategory: () => void
  onEditAsset: (asset: NurseryAsset) => void
  onDeleteAsset: (asset: NurseryAsset) => void
  onBulkDelete: () => void
}) {
  const allSelected = data.assets.length > 0 && selectedAssetIds.size === data.assets.length
  const fixedAssetsCount = data.assets.filter((asset) => asset.asset_type === 'fixed').length
  const currentAssetsCount = data.assets.filter((asset) => asset.asset_type === 'current').length
  const classifiedAssetsCount = data.assets.filter((asset) => asset.category_id !== null).length

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-4">
        <StatCard
          icon={Package2}
          title="إجمالي الأصول"
          value={formatNumber(data.summary.assets_count, 0)}
          helper="عدد الأصول المقيدة داخل دفتر أصول المشتل."
          tone="slate"
        />
        <StatCard
          icon={Landmark}
          title="القيمة الإجمالية"
          value={formatCurrency(data.summary.assets_total)}
          helper="إجمالي قيمة شراء الأصول الثابتة والمتداولة."
          tone="clay"
        />
        <StatCard
          icon={Rows3}
          title="أصول ثابتة / متداولة"
          value={`${formatNumber(fixedAssetsCount, 0)} / ${formatNumber(currentAssetsCount, 0)}`}
          helper="توزيع سريع بين الأصول الثابتة والأصول المتداولة."
          tone="emerald"
        />
        <StatCard
          icon={FileSpreadsheet}
          title="أصول مصنفة"
          value={formatNumber(classifiedAssetsCount, 0)}
          helper="الأصول المرتبطة فعلياً بتصنيف محلي داخل الوحدة."
          tone="amber"
        />
      </section>

      <section className="rounded-[2rem] border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">شريط أدوات دفتر الأصول</h2>
            <p className="mt-1 text-sm text-ink-soft">
              أضف أصولاً جديدة، استورد ملفات الإكسيل، نزّل النموذج الرسمي، ونفذ إجراءات جماعية من نفس اللوحة.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <HeaderActionButton icon={Plus} label="إضافة أصل جديد" onClick={onOpenCreateAsset} />
            <HeaderActionButton icon={Upload} label="رفع بيانات" tone="secondary" onClick={onOpenImport} />
            <HeaderActionButton
              icon={ArrowDownToLine}
              label="تنزيل النموذج"
              tone="secondary"
              href={nurseryExpensesApi.downloadAssetTemplateUrl()}
            />
            <HeaderActionButton
              icon={RefreshCw}
              label={`تغيير التصنيف (${formatNumber(selectedAssetIds.size, 0)})`}
              tone="secondary"
              disabled={selectedAssetIds.size === 0}
              onClick={onOpenBulkCategory}
            />
            <HeaderActionButton
              icon={Trash2}
              label={`حذف المحدد (${formatNumber(selectedAssetIds.size, 0)})`}
              tone="secondary"
              disabled={selectedAssetIds.size === 0}
              onClick={onBulkDelete}
            />
          </div>
        </div>
      </section>

      {data.grouped_assets.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-3">
          {data.grouped_assets.map((group) => (
            <article
              key={group.category_name}
              className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm transition-all duration-200 hover:border-line-strong hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">{group.category_name}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {formatNumber(group.items_count, 0)} أصل
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-subtle text-action-primary">
                  <Package2 className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-xl font-bold text-action-primary">{formatCurrency(group.total)}</p>
            </article>
          ))}
        </section>
      ) : null}

      {data.assets.length === 0 ? (
        <EmptyState
          icon={Package2}
          title="لا توجد أصول مشتلية مسجلة"
          description="ابدأ بإضافة أول أصل للمشتل مثل البيوت الشبكية، مناطق الخدمة، أو مكونات البنية الزراعية."
          action={<HeaderActionButton icon={Plus} label="إضافة أصل جديد" onClick={onOpenCreateAsset} />}
        />
      ) : (
        <>
          <section className="hidden overflow-hidden rounded-[2rem] border border-line bg-surface shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] text-right">
                <thead className="bg-surface-subtle text-xs font-semibold text-ink-soft">
                  <tr>
                    <th className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(event) => onToggleAllAssets(event.target.checked)}
                        className="h-4 w-4 rounded border-line text-action-primary focus:ring-action-primary"
                      />
                    </th>
                    <th className="px-4 py-4">اسم الأصل</th>
                    <th className="px-4 py-4">رمز الأصل</th>
                    <th className="px-4 py-4">رقم المستند</th>
                    <th className="px-4 py-4">تاريخ الشراء</th>
                    <th className="px-4 py-4">قيمة الشراء</th>
                    <th className="px-4 py-4">حساب الأصل (ثابت/متداول)</th>
                    <th className="px-4 py-4">حساب المصروف</th>
                    <th className="px-4 py-4">رقم الحساب</th>
                    <th className="px-4 py-4">إجراءات التعديل والحذف</th>
                  </tr>
                </thead>
                <tbody>
                  {data.assets.map((asset) => (
                    <tr key={asset.id} className="border-t border-line text-sm text-ink transition-all duration-200 hover:bg-surface-subtle">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedAssetIds.has(asset.id)}
                          onChange={() => onToggleAsset(asset.id)}
                          className="h-4 w-4 rounded border-line text-action-primary focus:ring-action-primary"
                        />
                      </td>
                      <td className="px-4 py-4 font-semibold">{asset.name}</td>
                      <td className="px-4 py-4 font-tabular text-ink-soft">{asset.code || '—'}</td>
                      <td className="px-4 py-4 font-tabular text-ink-soft">{asset.document_number || '—'}</td>
                      <td className="px-4 py-4">{formatDate(asset.purchase_date)}</td>
                      <td className="px-4 py-4 font-tabular font-semibold text-action-primary">
                        {formatCurrency(asset.purchase_value)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-surface-subtle px-3 py-1.5 text-xs font-semibold text-ink-soft">
                          {asset.asset_type === 'fixed' ? 'ثابت' : 'متداول'}
                        </span>
                      </td>
                      <td className="px-4 py-4">{asset.expense_account_name || asset.account_name || '—'}</td>
                      <td className="px-4 py-4 font-tabular text-ink-soft">
                        {asset.expense_account_number || asset.asset_account_number || '—'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onEditAsset(asset)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-line bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-soft active:scale-[0.98] transition-all duration-200 hover:text-ink"
                          >
                            <PencilLine className="h-4 w-4" />
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteAsset(asset)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 active:scale-[0.98] transition-all duration-200 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 lg:hidden">
            {data.assets.map((asset) => (
              <article key={asset.id} className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAssetIds.has(asset.id)}
                        onChange={() => onToggleAsset(asset.id)}
                        className="h-4 w-4 rounded border-line text-action-primary focus:ring-action-primary"
                      />
                      <h3 className="text-base font-bold text-ink">{asset.name}</h3>
                    </div>
                    <p className="mt-2 text-sm text-ink-soft">{asset.code || 'بدون رمز أصل'}</p>
                  </div>
                  <span className="rounded-full bg-surface-subtle px-3 py-1.5 text-xs font-semibold text-ink-soft">
                    {asset.asset_type === 'fixed' ? 'ثابت' : 'متداول'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-line bg-surface-subtle px-4 py-3">
                    <p className="text-xs font-semibold text-ink-muted">رقم المستند</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{asset.document_number || '—'}</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-surface-subtle px-4 py-3">
                    <p className="text-xs font-semibold text-ink-muted">تاريخ الشراء</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{formatDate(asset.purchase_date)}</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-surface-subtle px-4 py-3">
                    <p className="text-xs font-semibold text-ink-muted">قيمة الشراء</p>
                    <p className="mt-1 text-sm font-semibold text-action-primary">
                      {formatCurrency(asset.purchase_value)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-line bg-surface-subtle px-4 py-3">
                    <p className="text-xs font-semibold text-ink-muted">رقم الحساب</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {asset.expense_account_number || asset.asset_account_number || '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-line bg-surface-subtle px-4 py-3">
                  <p className="text-xs font-semibold text-ink-muted">حساب المصروف</p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {asset.expense_account_name || asset.account_name || '—'}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEditAsset(asset)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-line bg-surface-subtle px-3 py-2 text-xs font-semibold text-ink-soft active:scale-[0.98] transition-all duration-200 hover:text-ink"
                  >
                    <PencilLine className="h-4 w-4" />
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAsset(asset)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 active:scale-[0.98] transition-all duration-200 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف
                  </button>
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  )
}

function ExpensesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-skeleton-shimmer rounded-[2rem]" />
      <div className="h-28 animate-skeleton-shimmer rounded-[2rem]" />
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-skeleton-shimmer rounded-[1.75rem]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <div className="h-[620px] animate-skeleton-shimmer rounded-[2rem]" />
        <div className="h-[620px] animate-skeleton-shimmer rounded-[2rem]" />
      </div>
    </div>
  )
}

export default function NurseryExpensesPage() {
  const [activeTab, setActiveTab] = useState<ExpensesTab>('tree')
  const [manualSelectedAccountId, setManualSelectedAccountId] = useState<number | null>(null)
  const [accountDialogState, setAccountDialogState] = useState<AccountDialogState | null>(null)
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<NurseryAsset | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [bulkCategoryDialogOpen, setBulkCategoryDialogOpen] = useState(false)
  const [selectedAssetIdsState, setSelectedAssetIds] = useState<Set<number>>(new Set())
  const [collapsedAccountIds, setCollapsedAccountIds] = useState<Set<number>>(new Set())
  const [draggingAccountId, setDraggingAccountId] = useState<number | null>(null)
  const [dragOverAccountId, setDragOverAccountId] = useState<number | null>(null)

  const bootstrapQuery = useNurseryExpensesBootstrap()
  const createAccountMutation = useCreateNurseryExpenseAccount()
  const updateAccountMutation = useUpdateNurseryExpenseAccount()
  const deleteAccountMutation = useDeleteNurseryExpenseAccount()
  const togglePinMutation = useToggleNurseryExpenseAccountPin()
  const moveAccountMutation = useMoveNurseryExpenseAccount()
  const createTransactionMutation = useCreateNurseryExpenseTransaction()
  const uploadExpenseFileMutation = useUploadNurseryExpenseFile()
  const createAssetMutation = useCreateNurseryAsset()
  const updateAssetMutation = useUpdateNurseryAsset()
  const deleteAssetMutation = useDeleteNurseryAsset()
  const bulkDeleteAssetsMutation = useBulkDeleteNurseryAssets()
  const bulkUpdateAssetCategoryMutation = useBulkUpdateNurseryAssetCategory()
  const importAssetsMutation = useImportNurseryAssets()

  const data = bootstrapQuery.data?.data
  const flattenedAccounts = useMemo(() => flattenAccounts(data?.accounts ?? []), [data?.accounts])
  const allAccountIds = useMemo(() => new Set(flattenedAccounts.map((account) => account.id)), [flattenedAccounts])
  const expandedIds = useMemo(() => {
    const next = new Set<number>()
    allAccountIds.forEach((id) => {
      if (!collapsedAccountIds.has(id)) next.add(id)
    })
    return next
  }, [allAccountIds, collapsedAccountIds])
  const selectedAccountId =
    manualSelectedAccountId !== null && allAccountIds.has(manualSelectedAccountId)
      ? manualSelectedAccountId
      : data?.pinned_accounts[0]?.id ?? data?.accounts[0]?.id ?? null
  const selectedAccount = useMemo(
    () => flattenedAccounts.find((account) => account.id === selectedAccountId) ?? null,
    [flattenedAccounts, selectedAccountId]
  )
  const selectedAssetIds = useMemo(() => {
    const validIds = new Set((data?.assets ?? []).map((asset) => asset.id))
    return new Set(Array.from(selectedAssetIdsState).filter((id) => validIds.has(id)))
  }, [data?.assets, selectedAssetIdsState])
  const detailsQuery = useNurseryExpenseDetails(selectedAccountId)

  const openCreateRootAccount = () => {
    setAccountDialogState({ mode: 'create-root', account: null, parentId: null })
    setAccountDialogOpen(true)
  }

  const openCreateChildAccount = (account: NurseryExpenseAccountNode) => {
    setAccountDialogState({ mode: 'create-child', account: null, parentId: account.id })
    setManualSelectedAccountId(account.id)
    setAccountDialogOpen(true)
  }

  const openEditAccount = (account: NurseryExpenseAccountNode) => {
    setAccountDialogState({ mode: 'edit', account, parentId: account.parent_id })
    setManualSelectedAccountId(account.id)
    setAccountDialogOpen(true)
  }

  const handleAccountSubmit = async (payload: NurseryExpenseAccountPayload, accountId?: number) => {
    if (accountId) {
      await updateAccountMutation.mutateAsync({ id: accountId, payload })
      return
    }

    await createAccountMutation.mutateAsync(payload)
  }

  const handleDeleteAccount = async (account: NurseryExpenseAccountNode) => {
    if (!window.confirm(`هل تريد حذف الحساب "${account.name}"؟ سيتم حذف الفروع التابعة أيضاً.`)) return
    await deleteAccountMutation.mutateAsync(account.id)
  }

  const handleTogglePin = async (account: NurseryExpenseAccountNode) => {
    setManualSelectedAccountId(account.id)
    await togglePinMutation.mutateAsync(account.id)
  }

  const handleToggleExpand = (id: number) => {
    setCollapsedAccountIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDragOver = (targetId: number, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (draggingAccountId === targetId) return
    setDragOverAccountId(targetId)
  }

  const handleDrop = async (targetId: number, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOverAccountId(null)
    if (!draggingAccountId || draggingAccountId === targetId) return

    if (!window.confirm('هل تريد نقل هذا الحساب تحت الحساب المستهدف؟')) return
    await moveAccountMutation.mutateAsync({ id: draggingAccountId, newParentId: targetId })
  }

  const handleSelectAsset = (assetId: number) => {
    setSelectedAssetIds((current) => {
      const next = new Set(current)
      if (next.has(assetId)) next.delete(assetId)
      else next.add(assetId)
      return next
    })
  }

  const handleToggleAllAssets = (checked: boolean) => {
    if (!data) return
    setSelectedAssetIds(checked ? new Set(data.assets.map((asset) => asset.id)) : new Set())
  }

  const handleDeleteAsset = async (asset: NurseryAsset) => {
    if (!window.confirm(`هل تريد حذف الأصل "${asset.name}"؟`)) return
    await deleteAssetMutation.mutateAsync(asset.id)
  }

  const handleBulkDeleteAssets = async () => {
    const ids = Array.from(selectedAssetIds)
    if (ids.length === 0) return
    if (!window.confirm(`هل تريد حذف ${ids.length} أصل؟ لا يمكن التراجع عن هذا الإجراء.`)) return
    await bulkDeleteAssetsMutation.mutateAsync(ids)
    setSelectedAssetIds(new Set())
  }

  const handleAssetSubmit = async (payload: NurseryAssetPayload, assetId?: number) => {
    if (assetId) {
      await updateAssetMutation.mutateAsync({ id: assetId, payload })
      return
    }
    await createAssetMutation.mutateAsync(payload)
  }

  const assetActionsAvailable = selectedAssetIds.size > 0
  const isAccountMutationPending =
    createAccountMutation.isPending ||
    updateAccountMutation.isPending ||
    deleteAccountMutation.isPending ||
    togglePinMutation.isPending ||
    moveAccountMutation.isPending

  return (
    <div className="min-h-full space-y-6 bg-background text-foreground" dir="rtl">
      <section className="rounded-[2rem] border border-line bg-surface p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-[rgba(194,65,12,0.08)] text-action-primary">
                <WalletCards className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-ink">مصروفات وتكاليف المشتل</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
                  إدارة شجرة حسابات التكاليف، العمليات المالية، وتتبع أصول المشتل المعزولة.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 xl:max-w-[48rem] xl:justify-end">
            {activeTab === 'tree' ? (
              <>
                <HeaderActionButton icon={Plus} label="+ إضافة حساب رئيسي" onClick={openCreateRootAccount} />
                <HeaderActionButton
                  icon={BadgePlus}
                  label="إضافة حركة مالية"
                  tone="secondary"
                  disabled={!selectedAccount}
                  onClick={() => setTransactionDialogOpen(true)}
                />
                <HeaderActionButton
                  icon={Upload}
                  label="رفع بيانات إكسيل"
                  tone="secondary"
                  disabled={!selectedAccount}
                  onClick={() => setUploadDialogOpen(true)}
                />
              </>
            ) : (
              <>
                <HeaderActionButton icon={Plus} label="+ إضافة أصل جديد" onClick={() => setAssetDialogOpen(true)} />
                <HeaderActionButton icon={Upload} label="رفع بيانات إكسيل" tone="secondary" onClick={() => setImportDialogOpen(true)} />
                <HeaderActionButton
                  icon={RefreshCw}
                  label={`إجراء جماعي (${formatNumber(selectedAssetIds.size, 0)})`}
                  tone="secondary"
                  disabled={!assetActionsAvailable}
                  onClick={() => setBulkCategoryDialogOpen(true)}
                />
              </>
            )}
          </div>
        </div>
      </section>

      <TabSwitcher activeTab={activeTab} onChange={setActiveTab} />

      {bootstrapQuery.isLoading ? <ExpensesPageSkeleton /> : null}

      {bootstrapQuery.isError ? (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-700">
          <h2 className="text-lg font-bold">تعذر تحميل بيانات مصروفات المشتل</h2>
          <p className="mt-2 text-sm">{getErrorMessage(bootstrapQuery.error)}</p>
        </div>
      ) : null}

      {data ? (
        <>
          {activeTab === 'tree' ? (
            <TreeTab
              data={data}
              selectedAccount={selectedAccount}
              details={detailsQuery.data?.data}
              detailsLoading={detailsQuery.isLoading || detailsQuery.isFetching}
              selectedAccountId={selectedAccountId}
              expandedIds={expandedIds}
              draggingAccountId={draggingAccountId}
              dragOverAccountId={dragOverAccountId}
              onToggleExpand={handleToggleExpand}
              onSelectAccount={setManualSelectedAccountId}
              onOpenDetails={(accountId) => {
                setManualSelectedAccountId(accountId)
                setDetailsDialogOpen(true)
              }}
              onCreateRoot={openCreateRootAccount}
              onAddChild={openCreateChildAccount}
              onEditAccount={openEditAccount}
              onDeleteAccount={handleDeleteAccount}
              onTogglePin={handleTogglePin}
              onOpenTransaction={() => setTransactionDialogOpen(true)}
              onOpenUpload={() => setUploadDialogOpen(true)}
              onDragStart={setDraggingAccountId}
              onDragEnd={() => {
                setDraggingAccountId(null)
                setDragOverAccountId(null)
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ) : null}

          {activeTab === 'assets' ? (
            <AssetsTab
              data={data}
              selectedAssetIds={selectedAssetIds}
              onToggleAsset={handleSelectAsset}
              onToggleAllAssets={handleToggleAllAssets}
              onOpenCreateAsset={() => {
                setEditingAsset(null)
                setAssetDialogOpen(true)
              }}
              onOpenImport={() => setImportDialogOpen(true)}
              onOpenBulkCategory={() => setBulkCategoryDialogOpen(true)}
              onEditAsset={(asset) => {
                setEditingAsset(asset)
                setAssetDialogOpen(true)
              }}
              onDeleteAsset={handleDeleteAsset}
              onBulkDelete={handleBulkDeleteAssets}
            />
          ) : null}
        </>
      ) : null}

      <AccountDialog
        key={`account-${accountDialogState?.mode ?? 'idle'}-${
          accountDialogState?.mode === 'edit'
            ? accountDialogState.account.id
            : accountDialogState?.parentId ?? 'root'
        }-${accountDialogOpen ? 'open' : 'closed'}`}
        open={accountDialogOpen}
        onClose={() => setAccountDialogOpen(false)}
        state={accountDialogState}
        tree={data?.accounts ?? []}
        onSubmit={handleAccountSubmit}
        isPending={isAccountMutationPending}
      />

      <TransactionDialog
        key={`transaction-${selectedAccount?.id ?? 'none'}-${transactionDialogOpen ? 'open' : 'closed'}`}
        open={transactionDialogOpen}
        onClose={() => setTransactionDialogOpen(false)}
        account={selectedAccount}
        onSubmit={async (accountId, payload) => {
          await createTransactionMutation.mutateAsync({ accountId, payload })
        }}
        isPending={createTransactionMutation.isPending}
      />

      <UploadExpenseFileDialog
        key={`upload-${selectedAccount?.id ?? 'none'}-${uploadDialogOpen ? 'open' : 'closed'}`}
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        account={selectedAccount}
        onSubmit={async (accountId, file) => {
          await uploadExpenseFileMutation.mutateAsync({ accountId, file })
        }}
        isPending={uploadExpenseFileMutation.isPending}
      />

      <AssetDialog
        key={`asset-${editingAsset?.id ?? 'new'}-${assetDialogOpen ? 'open' : 'closed'}`}
        open={assetDialogOpen}
        onClose={() => {
          setAssetDialogOpen(false)
          setEditingAsset(null)
        }}
        asset={editingAsset}
        categories={data?.asset_categories ?? []}
        accounts={data?.flat_accounts ?? []}
        onSubmit={handleAssetSubmit}
        isPending={createAssetMutation.isPending || updateAssetMutation.isPending}
      />

      <ImportAssetsDialog
        key={`import-${importDialogOpen ? 'open' : 'closed'}`}
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onSubmit={async (file) => {
          await importAssetsMutation.mutateAsync(file)
        }}
        isPending={importAssetsMutation.isPending}
      />

      <BulkCategoryDialog
        key={`bulk-category-${selectedAssetIds.size}-${bulkCategoryDialogOpen ? 'open' : 'closed'}`}
        open={bulkCategoryDialogOpen}
        onClose={() => setBulkCategoryDialogOpen(false)}
        categories={data?.asset_categories ?? []}
        count={selectedAssetIds.size}
        onSubmit={async (categoryId) => {
          await bulkUpdateAssetCategoryMutation.mutateAsync({
            ids: Array.from(selectedAssetIds),
            categoryId,
          })
          setSelectedAssetIds(new Set())
        }}
        isPending={bulkUpdateAssetCategoryMutation.isPending}
      />

      <DetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        account={selectedAccount}
        details={detailsQuery.data?.data}
        isLoading={detailsQuery.isLoading || detailsQuery.isFetching}
      />
    </div>
  )
}
