'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, Loader2, Search, X } from 'lucide-react'
import { z } from 'zod'
import { useCreateMovement, useItemBalance, useItems, useWarehouses } from '@/lib/hooks/useInventory'
import type { Item, Warehouse } from '@/lib/types'
import AppDialog from '@/components/ui/AppDialog'

interface CreateMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: 'in' | 'out'
  defaultWarehouseId?: number
}

interface ComboboxOption {
  value: number
  label: string
  description?: string
}

const createMovementSchema = z.object({
  type: z.enum(['in', 'out']),
  warehouse_id: z.coerce.number().min(1, 'المستودع مطلوب'),
  item_id: z.coerce.number().min(1, 'الصنف مطلوب'),
  quantity: z.coerce.number().min(0.001, 'الكمية يجب أن تكون أكبر من صفر'),
  unit_cost: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
})

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message
  }
  return 'حدث خطأ أثناء تسجيل الحركة'
}

function SearchableCombobox({
  label,
  value,
  options,
  placeholder,
  disabled,
  error,
  onChange,
  onClear,
}: {
  label: string
  value: number
  options: ComboboxOption[]
  placeholder: string
  disabled?: boolean
  error?: string
  onChange: (value: number) => void
  onClear?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = options.find((option) => option.value === value)
  const filteredOptions = options.filter((option) => {
    const query = search.trim().toLowerCase()
    return !query || option.label.toLowerCase().includes(query) || option.description?.toLowerCase().includes(query)
  })

  useEffect(() => {
    if (!isOpen) setSearch('')
  }, [isOpen])

  return (
    <div className="relative">
      <label className="text-sm font-semibold text-gray-700 block mb-1">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 text-right flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-farm-blue ${
          error ? 'border-red-500' : 'border-gray-200'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <ChevronDown className="w-4 h-4 text-gray-400" />
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>{selected?.label ?? placeholder}</span>
      </button>
      {onClear && value > 0 && !disabled && (
        <button
          type="button"
          onClick={onClear}
          className="absolute left-9 top-8 text-gray-400 hover:text-gray-700"
          aria-label="مسح الاختيار"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {error && <p className="text-xs text-red-600 mt-1 mr-1">{error}</p>}
      {isOpen && !disabled && (
        <div className="absolute z-[70] mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="بحث..."
              className="w-full text-sm outline-none text-right"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">لا توجد نتائج</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className="w-full px-3 py-2 text-right hover:bg-gray-50 flex items-center justify-between gap-3"
                >
                  <Check className={`w-4 h-4 ${value === option.value ? 'text-farm-blue' : 'text-transparent'}`} />
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                    {option.description && <span className="block text-xs text-gray-500">{option.description}</span>}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function CreateMovementDialog({ open, onOpenChange, defaultType = 'in', defaultWarehouseId }: CreateMovementDialogProps) {
  const [type, setType] = useState<'in' | 'out'>(defaultType)
  const [warehouseId, setWarehouseId] = useState(defaultWarehouseId ?? 0)
  const [itemId, setItemId] = useState(0)
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [inlineError, setInlineError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const createMutation = useCreateMovement()
  const { data: warehousesData, isLoading: isWarehousesLoading } = useWarehouses(1, 100)
  const { data: itemsData, isLoading: isItemsLoading } = useItems(1, 100)
  const { data: balanceData, isLoading: isBalanceLoading } = useItemBalance(warehouseId, itemId)

  const warehouses = useMemo(() => {
    const raw = warehousesData
    return (Array.isArray(raw) ? raw : (raw as any)?.data || []) as Warehouse[]
  }, [warehousesData])
  const items = useMemo(() => {
    const raw = itemsData
    return (Array.isArray(raw) ? raw : (raw as any)?.data || []) as Item[]
  }, [itemsData])
  const selectedItem = items.find((item) => item.id === itemId)
  const unitLabel = selectedItem?.unit || 'كجم'
  const availableBalance = Number(balanceData?.data.quantity_on_hand ?? 0)
  const quantityValue = Number(quantity || 0)
  const exceedsBalance = type === 'out' && itemId > 0 && warehouseId > 0 && quantityValue > availableBalance

  const warehouseOptions = warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.name,
    description: warehouse.code,
  }))
  const itemOptions = items.map((item) => ({
    value: item.id,
    label: item.name,
    description: item.unit ? `الوحدة: ${item.unit}` : undefined,
  }))
  const resetForm = () => {
    setType(defaultType)
    setWarehouseId(defaultWarehouseId ?? 0)
    setItemId(0)
    setQuantity('')
    setUnitCost('')
    setNotes('')
    setErrors({})
    setInlineError('')
    setSuccessMessage('')
    createMutation.reset()
  }

  useEffect(() => {
    if (open) resetForm()
  }, [open, defaultType, defaultWarehouseId])

  if (!open) return null

  const handleTypeChange = (nextType: 'in' | 'out') => {
    if (nextType === type) return
    setType(nextType)
    setQuantity('')
    setUnitCost('')
    setNotes('')
    setErrors({})
    setInlineError('')
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setInlineError('')
    setSuccessMessage('')

    const payload = {
      type,
      warehouse_id: warehouseId,
      item_id: itemId,
      quantity: Number(quantity),
      unit_cost: unitCost === '' ? undefined : Number(unitCost),
      notes: notes.trim() || undefined,
    }
    const parsed = createMovementSchema.safeParse(payload)

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0]
        if (typeof field === 'string') nextErrors[field] = issue.message
      })
      setErrors(nextErrors)
      return
    }

    if (exceedsBalance) {
      setInlineError(`الرصيد غير كافٍ — المتاح: ${availableBalance.toFixed(3)} ${unitLabel}`)
      return
    }

    createMutation.mutate(parsed.data, {
      onSuccess: () => {
        setSuccessMessage('تم تسجيل الحركة بنجاح')
        setTimeout(() => {
          resetForm()
          onOpenChange(false)
        }, 600)
      },
      onError: (error) => {
        const message = getErrorMessage(error)
        setInlineError(message.includes('Insufficient stock') ? `الرصيد غير كافٍ — المتاح: ${availableBalance.toFixed(3)} ${unitLabel}` : message)
      },
    })
  }

  return (
    <AppDialog open={open} onClose={handleClose} panelClassName="max-w-3xl">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-surface shadow-xl" dir="rtl">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 rounded-t-2xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">إضافة حركة مخزون</h2>
            <p className="text-sm text-gray-500 mt-1">تسجيل وارد أو صادر يدوي مع تحديث الرصيد مباشرة</p>
          </div>
          <button type="button" onClick={handleClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <section>
            <label className="text-sm font-semibold text-gray-700 block mb-2">نوع الحركة</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('in')}
                className={`py-4 rounded-2xl border-2 font-bold text-lg transition-colors ${
                  type === 'in' ? 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-400 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                وارد ←
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('out')}
                className={`py-4 rounded-2xl border-2 font-bold text-lg transition-colors ${
                  type === 'out' ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                → صادر
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchableCombobox
              label="المستودع"
              value={warehouseId}
              options={warehouseOptions}
              placeholder={isWarehousesLoading ? 'جاري التحميل...' : 'اختر المستودع'}
              disabled={isWarehousesLoading || createMutation.isPending}
              error={errors.warehouse_id}
              onChange={setWarehouseId}
            />
            <SearchableCombobox
              label="الصنف"
              value={itemId}
              options={itemOptions}
              placeholder={isItemsLoading ? 'جاري التحميل...' : 'اختر الصنف'}
              disabled={isItemsLoading || createMutation.isPending}
              error={errors.item_id}
              onChange={setItemId}
            />
          </section>

          {warehouseId > 0 && itemId > 0 && (
            <section className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-blue-900 dark:bg-blue-950/30 dark:border-blue-900/40 dark:text-blue-200">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span>الرصيد الحالي:</span>
                {isBalanceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{availableBalance.toFixed(3)} {unitLabel}</span>}
              </div>
              {exceedsBalance && (
                <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <span>الكمية المطلوبة تتجاوز الرصيد المتاح ({availableBalance.toFixed(3)} {unitLabel})</span>
                </div>
              )}
            </section>
          )}

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">الكمية</label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={createMutation.isPending}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue text-right"
              />
              {errors.quantity && <p className="text-xs text-red-600 mt-1 mr-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">تكلفة الوحدة (اختياري)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(event) => setUnitCost(event.target.value)}
                disabled={createMutation.isPending}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue text-right"
              />
              {errors.unit_cost && <p className="text-xs text-red-600 mt-1 mr-1">{errors.unit_cost}</p>}
            </div>
          </section>

          <section>
            <label className="text-sm font-semibold text-gray-700 block mb-1">ملاحظات (اختياري)</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              disabled={createMutation.isPending}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue text-right resize-none"
            />
            <div className="text-xs text-gray-400 mt-1 text-left">{notes.length}/500</div>
            {errors.notes && <p className="text-xs text-red-600 mt-1 mr-1">{errors.notes}</p>}
          </section>

          {(inlineError || successMessage) && (
            <div className={`p-3 rounded-xl text-sm ${inlineError ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
              {inlineError || successMessage}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || exceedsBalance || isBalanceLoading}
              className={`px-6 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                type === 'in' ? 'bg-farm-green hover:bg-farm-green/90' : 'bg-red-600 hover:bg-red-600/90'
              }`}
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {type === 'in' ? 'تسجيل وارد' : 'تسجيل صادر'}
            </button>
          </div>
        </form>
      </div>
    </AppDialog>
  )
}
