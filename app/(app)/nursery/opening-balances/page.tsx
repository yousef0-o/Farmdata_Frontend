'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import {
  AlertCircle,
  CheckCircle2,
  Coins,
  Database,
  Loader2,
  PackageOpen,
  Save,
  Scale,
  Search,
  Sprout,
  WalletCards,
} from 'lucide-react'
import {
  useNurseryOpeningBalances,
  useSaveNurseryOpeningBalances,
} from '@/lib/hooks/useNurseryOpeningBalances'
import type { NurseryOpeningBalanceRow } from '@/lib/types/nurseryOpeningBalances'

const openingBalanceRowSchema = z.object({
  id: z.number(),
  name: z.string(),
  category_name: z.string(),
  unit: z.string(),
  item_value: z.number(),
  low_stock: z.boolean(),
  quantity: z.number().min(0, 'الرصيد الافتتاحي يجب أن يكون 0 أو أكثر'),
  opening_balance_date: z.string().nullable(),
})

const openingBalancesSchema = z.object({
  items: z.array(openingBalanceRowSchema).min(1, 'لا توجد أصناف لحفظ أرصدتها.'),
})

type OpeningBalancesFormValues = z.infer<typeof openingBalancesSchema>

type ApiError = {
  message?: string
  errors?: Record<string, string[]>
}

const today = () => new Date().toISOString().slice(0, 10)

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('ar-SA', {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : Math.min(2, maximumFractionDigits),
  }).format(value)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 2,
  }).format(value)
}

function getErrorMessage(error: unknown) {
  const fallback = 'تعذر حفظ الأرصدة الافتتاحية.'
  if (!error || typeof error !== 'object') return fallback

  const apiError = error as ApiError
  if (apiError.errors) {
    const first = Object.values(apiError.errors)[0]?.[0]
    if (first) return first
  }

  return apiError.message ?? fallback
}

function buildFormDefaults(items: NurseryOpeningBalanceRow[]): OpeningBalancesFormValues {
  return {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      category_name: item.category_name,
      unit: item.unit,
      item_value: Number(item.opening_item_value ?? item.item_value),
      low_stock: item.low_stock,
      quantity: Number(item.quantity),
      opening_balance_date: item.opening_balance_date ?? today(),
    })),
  }
}

function OpeningBalancesSkeleton() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="h-20 animate-skeleton-shimmer rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-skeleton-shimmer rounded-2xl border border-slate-100 dark:border-slate-800"
          />
        ))}
      </div>
      <div className="h-[540px] animate-skeleton-shimmer rounded-2xl border border-slate-100 dark:border-slate-800" />
    </div>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Scale
  label: string
  value: string
  hint: string
  tone: 'clay' | 'emerald' | 'slate' | 'amber'
}) {
  const toneClass =
    tone === 'clay'
      ? 'bg-orange-50 text-terracotta'
      : tone === 'emerald'
        ? 'bg-emerald-50 text-emerald-700'
        : tone === 'amber'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300'

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-50">{value}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  )
}

export default function NurseryOpeningBalancesPage() {
  const [query, setQuery] = useState('')
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const { data, isLoading, isError, error } = useNurseryOpeningBalances()
  const saveMutation = useSaveNurseryOpeningBalances()
  const rows = useMemo(() => data?.data.items ?? [], [data])
  const serverSummary = data?.data.summary

  const form = useForm<OpeningBalancesFormValues>({
    resolver: zodResolver(openingBalancesSchema),
    defaultValues: { items: [] },
    mode: 'onChange',
  })

  const { fields } = useFieldArray({
    control: form.control,
    name: 'items',
    keyName: 'fieldKey',
  })

  useEffect(() => {
    if (rows.length > 0) {
      form.reset(buildFormDefaults(rows))
    }
  }, [rows, form])

  const watchedRawItems = useWatch({
    control: form.control,
    name: 'items',
  })
  const watchedItems = useMemo(() => watchedRawItems ?? [], [watchedRawItems])

  const filteredFields = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return fields.map((field, index) => ({ field, index }))

    return fields
      .map((field, index) => ({ field, index }))
      .filter(({ field }) => {
        const item = field as unknown as OpeningBalancesFormValues['items'][number]
        return `${item.name} ${item.category_name}`.toLowerCase().includes(normalizedQuery)
      })
  }, [fields, query])

  const liveSummary = useMemo(() => {
    const items = watchedItems.filter(Boolean)
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const totalValue = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.item_value || 0),
      0
    )

    return {
      itemsCount: items.length,
      totalQuantity,
      totalValue,
      lowStockCount: items.filter((item) => item.low_stock).length,
    }
  }, [watchedItems])

  async function handleSubmit(values: OpeningBalancesFormValues) {
    setServerMessage(null)
    setServerError(null)

    try {
      const response = await saveMutation.mutateAsync({
        items: values.items.map((item) => ({
          id: item.id,
          quantity: Number(item.quantity),
          opening_balance_date: item.opening_balance_date || null,
        })),
      })
      setServerMessage(response.message)
      form.reset(buildFormDefaults(response.data.items))
    } catch (mutationError) {
      setServerError(getErrorMessage(mutationError))
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-full bg-background px-4 py-6 sm:px-6 lg:px-8" dir="rtl">
        <OpeningBalancesSkeleton />
      </main>
    )
  }

  if (isError) {
    return (
      <main className="min-h-full bg-background px-4 py-6 sm:px-6 lg:px-8" dir="rtl">
        <div className="rounded-2xl border border-red-100 bg-white p-6 text-red-700 shadow-sm dark:border-red-900 dark:bg-slate-950 dark:text-red-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-semibold">{getErrorMessage(error)}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-full bg-background px-4 py-6 sm:px-6 lg:px-8" dir="rtl">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="order-2 lg:order-1">
              <button
                type="submit"
                disabled={saveMutation.isPending || rows.length === 0}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#c2410c] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors transition-transform duration-200 active:scale-[0.98] hover:bg-[#9a3412] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                حفظ التغييرات
              </button>
            </div>

            <div className="order-1 flex items-start gap-3 text-right lg:order-2">
              <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Scale className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50">
                  الأرصدة الافتتاحية
                </h1>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  تأسيس الحسابات المالية، أصول المشاتل، والكميات الافتتاحية للمخازن
                </p>
              </div>
            </div>
          </div>
        </section>

        {serverMessage && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {serverMessage}
            </div>
          </div>
        )}

        {serverError && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {serverError}
            </div>
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-4">
          <SummaryTile
            icon={Database}
            label="الأصناف"
            value={formatNumber(liveSummary.itemsCount, 0)}
            hint={`محفوظ سابقاً: ${formatNumber(serverSummary?.committed_count ?? 0, 0)}`}
            tone="slate"
          />
          <SummaryTile
            icon={Sprout}
            label="إجمالي الكميات"
            value={formatNumber(liveSummary.totalQuantity, 3)}
            hint="مجموع الرصيد الافتتاحي"
            tone="emerald"
          />
          <SummaryTile
            icon={WalletCards}
            label="قيمة المخزون"
            value={formatCurrency(liveSummary.totalValue)}
            hint="الكمية في قيمة الصنف"
            tone="clay"
          />
          <SummaryTile
            icon={PackageOpen}
            label="أقل من الحد"
            value={formatNumber(liveSummary.lowStockCount, 0)}
            hint="حسب حد التنبيه الحالي"
            tone="amber"
          />
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">
                جدول الأرصدة حسب الأصناف
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                الأعمدة الأساسية مطابقة للملف القديم: الصنف، الفئة، الرصيد الافتتاحي، التاريخ.
              </p>
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="بحث باسم الصنف أو الفئة"
                className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50 pr-10 pl-3 text-sm font-medium text-slate-900 outline-none transition-colors focus:border-[#c2410c] focus:ring-2 focus:ring-orange-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-orange-950"
              />
            </div>
          </div>

          {fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 dark:bg-slate-900">
                <PackageOpen className="h-8 w-8" />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-950 dark:text-slate-50">
                لا توجد أصناف في المخزون
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                أضف أصناف مخزون المشتل أولاً، ثم ارجع لتثبيت الكميات الافتتاحية وتواريخها.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50 text-right text-xs font-bold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                      <th className="w-[30%] border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        الصنف
                      </th>
                      <th className="w-[20%] border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        الفئة
                      </th>
                      <th className="w-[25%] border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        الرصيد الافتتاحي
                      </th>
                      <th className="w-[25%] border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        التاريخ
                      </th>
                      <th className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        قيمة الوحدة
                      </th>
                      <th className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        الإجمالي
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFields.map(({ field, index }) => {
                      const row = watchedItems[index]
                      const rowTotal = Number(row?.quantity || 0) * Number(row?.item_value || 0)
                      const quantityError = form.formState.errors.items?.[index]?.quantity?.message
                      const dateError =
                        form.formState.errors.items?.[index]?.opening_balance_date?.message

                      return (
                        <tr key={field.fieldKey} className="text-sm text-slate-700 dark:text-slate-200">
                          <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
                            <div className="font-bold text-slate-950 dark:text-slate-50">
                              {row?.name}
                            </div>
                            {row?.low_stock && (
                              <div className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                                عند أو دون حد التنبيه
                              </div>
                            )}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
                            <span className="inline-flex rounded-lg bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                              {row?.category_name ?? 'غير مصنف'}
                            </span>
                          </td>
                          <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                                className="h-11 w-32 rounded-xl border border-slate-100 bg-white px-3 text-left text-sm font-semibold text-slate-950 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-emerald-950"
                              />
                              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                {row?.unit}
                              </span>
                            </div>
                            {quantityError && (
                              <p className="mt-1 text-xs font-semibold text-red-600">
                                {quantityError}
                              </p>
                            )}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
                            <input
                              type="date"
                              {...form.register(`items.${index}.opening_balance_date`)}
                              className="h-11 w-full rounded-xl border border-slate-100 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:focus:ring-emerald-950"
                            />
                            {dateError && (
                              <p className="mt-1 text-xs font-semibold text-red-600">{dateError}</p>
                            )}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-4 font-semibold dark:border-slate-800">
                            {formatCurrency(Number(row?.item_value ?? 0))}
                          </td>
                          <td className="border-b border-slate-100 px-4 py-4 font-bold text-terracotta dark:border-slate-800">
                            {formatCurrency(rowTotal)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-4 lg:hidden">
                {filteredFields.map(({ field, index }) => {
                  const row = watchedItems[index]
                  const rowTotal = Number(row?.quantity || 0) * Number(row?.item_value || 0)

                  return (
                    <article
                      key={field.fieldKey}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-950 dark:text-slate-50">
                            {row?.name}
                          </h3>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {row?.category_name ?? 'غير مصنف'}
                          </p>
                        </div>
                        <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-terracotta">
                          {formatCurrency(rowTotal)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-slate-500">
                            الرصيد الافتتاحي
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                              className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-left text-sm font-semibold outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50"
                            />
                            <span className="text-sm font-semibold text-slate-500">{row?.unit}</span>
                          </div>
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-bold text-slate-500">
                            التاريخ
                          </span>
                          <input
                            type="date"
                            {...form.register(`items.${index}.opening_balance_date`)}
                            className="h-11 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 text-sm font-semibold outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50"
                          />
                        </label>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </section>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
            يتم الحفظ داخل جدول مخصص للمشتل فقط، مع تحديث كمية الصنف وتاريخ الرصيد كما في الملف القديم.
          </div>
        </div>
      </form>
    </main>
  )
}
