'use client'

import React, { useState } from 'react'
import { X, Plus, Trash2, AlertCircle } from 'lucide-react'
import { z } from 'zod'
import { useCloseFlock } from '@/lib/hooks/useFlock'
import { useAccountingAccounts } from '@/lib/hooks/useArchive'
import type { AccountingAccount } from '@/lib/types'
import AppDialog from '@/components/ui/AppDialog'
import { Button } from '@/components/ui/Button'

interface CloseFlockDialogProps {
  flockId: number
  currentCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

const closeFlockSchema = z.object({
  close_date: z.string().min(1, 'تاريخ الإغلاق مطلوب'),
  allocations: z
    .array(
      z.object({
        label: z.string().min(1, 'اسم الوجهة مطلوب'),
        bird_count: z.coerce.number().int().min(1, 'أكبر من صفر'),
        value: z.coerce.number().min(0).optional(),
      })
    )
    .min(1, 'يجب إضافة وجهة واحدة على الأقل'),
})

type Allocation = {
  label: string
  bird_count: number | ''
  value: number | ''
}

type FinancialRow = {
  account_id: string
  reference_number: string
  transaction_date: string
  debit_amount: string
  credit_amount: string
  description: string
}

type AssetRow = {
  account_id: string
  debit_amount: string
  credit_amount: string
  description: string
}

export default function CloseFlockDialog({
  flockId,
  currentCount,
  open,
  onOpenChange,
}: CloseFlockDialogProps) {
  const closeFlock = useCloseFlock(flockId)
  const { data: accountsRes } = useAccountingAccounts()
  const [closeDate, setCloseDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [productionEndDate, setProductionEndDate] = useState('')
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [financialRows, setFinancialRows] = useState<FinancialRow[]>([])
  const [assetRows, setAssetRows] = useState<AssetRow[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!open) return null

  const totalAllocated = allocations.reduce(
    (sum, a) => sum + (typeof a.bird_count === 'number' ? a.bird_count : 0),
    0
  )
  const exceedsCount = totalAllocated > currentCount
  const accounts = (accountsRes?.data ?? []).filter(
    (account: AccountingAccount) => account.is_active !== false && account.is_leaf !== false
  )

  const addAllocation = () => {
    setAllocations([...allocations, { label: '', bird_count: '', value: '' }])
  }

  const removeAllocation = (idx: number) => {
    setAllocations(allocations.filter((_, i) => i !== idx))
  }

  const updateAllocation = (
    idx: number,
    field: keyof Allocation,
    value: string
  ) => {
    const updated = [...allocations]
    if (field === 'bird_count' || field === 'value') {
      updated[idx] = { ...updated[idx], [field]: value === '' ? '' : Number(value) }
    } else {
      updated[idx] = { ...updated[idx], [field]: value }
    }
    setAllocations(updated)
  }

  const addFinancialRow = () => {
    setFinancialRows([
      ...financialRows,
      {
        account_id: '',
        reference_number: '',
        transaction_date: closeDate,
        debit_amount: '',
        credit_amount: '',
        description: '',
      },
    ])
  }

  const updateFinancialRow = (idx: number, field: keyof FinancialRow, value: string) => {
    setFinancialRows(rows => rows.map((row, index) => index === idx ? { ...row, [field]: value } : row))
  }

  const removeFinancialRow = (idx: number) => {
    setFinancialRows(rows => rows.filter((_, index) => index !== idx))
  }

  const addAssetRow = () => {
    setAssetRows([...assetRows, { account_id: '', debit_amount: '', credit_amount: '', description: '' }])
  }

  const updateAssetRow = (idx: number, field: keyof AssetRow, value: string) => {
    setAssetRows(rows => rows.map((row, index) => index === idx ? { ...row, [field]: value } : row))
  }

  const removeAssetRow = (idx: number) => {
    setAssetRows(rows => rows.filter((_, index) => index !== idx))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = closeFlockSchema.safeParse({ close_date: closeDate, allocations })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.')
        if (!fieldErrors[path]) fieldErrors[path] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    if (exceedsCount) return

    const activeFinancialRows = financialRows.filter(row =>
      row.account_id || row.reference_number || row.transaction_date || row.debit_amount || row.credit_amount || row.description
    )
    const activeAssetRows = assetRows.filter(row =>
      row.account_id || row.debit_amount || row.credit_amount || row.description
    )
    const accountingErrors: Record<string, string> = {}
    activeFinancialRows.forEach((row, index) => {
      if (!row.account_id) accountingErrors[`financial_rows.${index}.account_id`] = 'الحساب مطلوب'
      if ((Number(row.debit_amount || 0) <= 0) && (Number(row.credit_amount || 0) <= 0)) {
        accountingErrors[`financial_rows.${index}.amount`] = 'أدخل قيمة مدينة أو دائنة'
      }
    })
    activeAssetRows.forEach((row, index) => {
      if (!row.account_id) accountingErrors[`asset_entries.${index}.account_id`] = 'الحساب مطلوب'
      if ((Number(row.debit_amount || 0) <= 0) && (Number(row.credit_amount || 0) <= 0)) {
        accountingErrors[`asset_entries.${index}.amount`] = 'أدخل قيمة مدينة أو دائنة'
      }
    })

    if (Object.keys(accountingErrors).length > 0) {
      setErrors(accountingErrors)
      return
    }

    closeFlock.mutate(
      {
        close_date: closeDate,
        production_end_date: productionEndDate || null,
        allocations: allocations.map((a) => ({
          label: a.label,
          bird_count: a.bird_count as number,
          value: (a.value as number) || undefined,
        })),
        financial_rows: activeFinancialRows.map(row => ({
          account_id: Number(row.account_id),
          reference_number: row.reference_number || null,
          transaction_date: row.transaction_date || closeDate,
          debit_amount: Number(row.debit_amount || 0),
          credit_amount: Number(row.credit_amount || 0),
          description: row.description || null,
        })),
        asset_entries: activeAssetRows.map(row => ({
          account_id: Number(row.account_id),
          debit_amount: Number(row.debit_amount || 0),
          credit_amount: Number(row.credit_amount || 0),
          description: row.description || null,
        })),
      },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <AppDialog open={open} onClose={() => onOpenChange(false)} panelClassName="max-w-5xl">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">إغلاق الفوج</h2>
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            size="icon"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        </div>

        {closeFlock.error && (
          <div className="mb-4 p-4 bg-red-50 border-r-4 border-red-500 text-red-700 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400 flex items-start gap-3 rounded-md">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              {(closeFlock.error as { message?: string })?.message ??
                'حدث خطأ أثناء إغلاق الفوج'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Close Date */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              تاريخ الإغلاق
            </label>
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue ${
                errors['close_date'] ? 'border-red-500' : 'border-gray-200'
              }`}
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
            />
            {errors['close_date'] && (
              <p className="text-xs text-red-600 mt-1 mr-1">
                {errors['close_date']}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              تاريخ نهاية الإنتاج
            </label>
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              className="w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue border-gray-200"
              value={productionEndDate}
              onChange={(e) => setProductionEndDate(e.target.value)}
            />
          </div>
          </div>

          {/* Allocations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">وجهات التوزيع</label>
              <Button
                type="button"
                onClick={addAllocation}
                variant="ghost"
                size="sm"
                className="text-action-primary"
              >
                <Plus className="w-4 h-4" />
                إضافة وجهة
              </Button>
            </div>

            {errors['allocations'] && (
              <p className="text-xs text-red-600 mb-2 mr-1">
                {errors['allocations']}
              </p>
            )}

            <div className="space-y-3">
              {allocations.map((alloc, idx) => (
                <div
                  key={idx}
                  className="grid gap-3 rounded-xl bg-gray-50 p-3 sm:grid-cols-[minmax(0,1fr)_7rem_7rem_2.75rem] sm:items-center"
                >
                  <input
                    type="text"
                    placeholder="اسم الوجهة"
                    className="min-h-11 min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue"
                    value={alloc.label}
                    onChange={(e) => updateAllocation(idx, 'label', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="عدد الطيور"
                    className="min-h-11 min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue"
                    value={alloc.bird_count}
                    onChange={(e) =>
                      updateAllocation(idx, 'bird_count', e.target.value)
                    }
                  />
                  <input
                    type="number"
                    placeholder="القيمة"
                    className="min-h-11 min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue"
                    value={alloc.value}
                    onChange={(e) =>
                      updateAllocation(idx, 'value', e.target.value)
                    }
                  />
                  <Button
                    type="button"
                    onClick={() => removeAllocation(idx)}
                    variant="ghost"
                    size="icon"
                    aria-label="حذف وجهة التوزيع"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Live total */}
            {allocations.length > 0 && (
              <div
                className={`mt-3 p-3 rounded-xl text-sm font-medium ${
                  exceedsCount
                    ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                    : 'bg-farm-blue/5 text-farm-blue dark:bg-farm-blue/10 dark:text-farm-blue'
                }`}
              >
                مجموع الطيور المخصصة:{' '}
                <span className="font-bold">{totalAllocated.toLocaleString()}</span>{' '}
                من{' '}
                <span className="font-bold">
                  {currentCount.toLocaleString()}
                </span>
                {exceedsCount && (
                  <p className="text-xs mt-1 text-red-600">
                    عدد الطيور يتجاوز العدد الحالي
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-gray-700">قيود مالية يدوية</label>
              <Button
                type="button"
                onClick={addFinancialRow}
                variant="ghost"
                size="sm"
                className="text-action-primary"
              >
                <Plus className="h-4 w-4" />
                إضافة قيد
              </Button>
            </div>
            {financialRows.length > 0 ? (
              <div className="space-y-3">
                {financialRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-1 gap-3 rounded-xl bg-gray-50 p-3 md:grid-cols-6">
                    <select
                      className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue md:col-span-2"
                      value={row.account_id}
                      onChange={(e) => updateFinancialRow(idx, 'account_id', e.target.value)}
                    >
                      <option value="">الحساب</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>{account.code} - {account.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="مرجع"
                      className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue"
                      value={row.reference_number}
                      onChange={(e) => updateFinancialRow(idx, 'reference_number', e.target.value)}
                    />
                    <input
                      type="date"
                      className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue"
                      value={row.transaction_date}
                      onChange={(e) => updateFinancialRow(idx, 'transaction_date', e.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="مدين"
                      className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue"
                      value={row.debit_amount}
                      onChange={(e) => updateFinancialRow(idx, 'debit_amount', e.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="دائن"
                      className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue"
                      value={row.credit_amount}
                      onChange={(e) => updateFinancialRow(idx, 'credit_amount', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="وصف القيد"
                      className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue md:col-span-5"
                      value={row.description}
                      onChange={(e) => updateFinancialRow(idx, 'description', e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={() => removeFinancialRow(idx)}
                      variant="ghost"
                      size="icon"
                      aria-label="حذف القيد المالي"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {(errors[`financial_rows.${idx}.account_id`] || errors[`financial_rows.${idx}.amount`]) && (
                      <p className="md:col-span-6 text-xs text-red-600">
                        {errors[`financial_rows.${idx}.account_id`] || errors[`financial_rows.${idx}.amount`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">لا توجد قيود يدوية إضافية.</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-gray-700">قيود أصول القطيع</label>
              <Button
                type="button"
                onClick={addAssetRow}
                variant="ghost"
                size="sm"
                className="text-action-primary"
              >
                <Plus className="h-4 w-4" />
                إضافة أصل
              </Button>
            </div>
            {assetRows.length > 0 ? (
              <div className="space-y-3">
                {assetRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-1 gap-3 rounded-xl bg-gray-50 p-3 md:grid-cols-5">
                    <select
                      className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue md:col-span-2"
                      value={row.account_id}
                      onChange={(e) => updateAssetRow(idx, 'account_id', e.target.value)}
                    >
                      <option value="">الحساب</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>{account.code} - {account.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="مدين"
                      className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue"
                      value={row.debit_amount}
                      onChange={(e) => updateAssetRow(idx, 'debit_amount', e.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="دائن"
                      className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue"
                      value={row.credit_amount}
                      onChange={(e) => updateAssetRow(idx, 'credit_amount', e.target.value)}
                    />
                    <Button
                      type="button"
                      onClick={() => removeAssetRow(idx)}
                      variant="ghost"
                      size="icon"
                      aria-label="حذف قيد أصل القطيع"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <input
                      type="text"
                      placeholder="وصف أصل القطيع"
                      className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-farm-blue md:col-span-5"
                      value={row.description}
                      onChange={(e) => updateAssetRow(idx, 'description', e.target.value)}
                    />
                    {(errors[`asset_entries.${idx}.account_id`] || errors[`asset_entries.${idx}.amount`]) && (
                      <p className="md:col-span-5 text-xs text-red-600">
                        {errors[`asset_entries.${idx}.account_id`] || errors[`asset_entries.${idx}.amount`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">لا توجد قيود أصول إضافية.</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={closeFlock.isPending || exceedsCount}
              isLoading={closeFlock.isPending}
              className="w-full sm:w-auto"
            >
              تأكيد الإغلاق
            </Button>
          </div>
        </form>
      </div>
    </AppDialog>
  )
}
