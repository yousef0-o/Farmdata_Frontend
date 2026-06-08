'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, Loader2, Search, X } from 'lucide-react'
import { z } from 'zod'
import { useCreateMovement, useItemBalance, useItems, useWarehouses } from '@/lib/hooks/useInventory'
import type { Item, Warehouse } from '@/lib/types'
import AppDialog from '@/components/ui/AppDialog'
import { Button } from '@/components/ui/Button'

interface CreateMovementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: MovementType
  defaultWarehouseId?: number
}

interface ComboboxOption {
  value: number
  label: string
  description?: string
}

type MovementType = 'in' | 'out' | 'adjustment' | 'transfer'

const createMovementSchema = z.object({
  type: z.enum(['in', 'out', 'adjustment', 'transfer']),
  warehouse_id: z.coerce.number().min(1, 'المستودع مطلوب'),
  to_warehouse_id: z.coerce.number().min(1, 'مستودع التحويل إليه مطلوب').optional(),
  item_id: z.coerce.number().min(1, 'الصنف مطلوب'),
  quantity: z.coerce.number().min(0.001, 'الكمية يجب أن تكون أكبر من صفر'),
  adjustment_direction: z.enum(['increase', 'decrease']).optional(),
  unit_cost: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
}).superRefine((value, context) => {
  if (value.type === 'transfer') {
    if (!value.to_warehouse_id) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['to_warehouse_id'], message: 'مستودع التحويل إليه مطلوب' })
    } else if (value.to_warehouse_id === value.warehouse_id) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['to_warehouse_id'], message: 'لا يمكن التحويل إلى نفس المستودع' })
    }
  }
  if (value.type === 'adjustment' && !value.adjustment_direction) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['adjustment_direction'], message: 'اتجاه التسوية مطلوب' })
  }
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
      <label className="mb-1 block text-sm font-semibold text-ink-soft">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-surface-muted px-4 py-2.5 text-right outline-none transition-colors focus-visible:ring-2 focus-visible:ring-action-primary/30 ${
          error ? 'border-danger' : 'border-line'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-surface-subtle'}`}
      >
        <ChevronDown className="w-4 h-4 text-ink-muted" />
        <span className={selected ? 'text-ink' : 'text-ink-muted'}>{selected?.label ?? placeholder}</span>
      </button>
      {onClear && value > 0 && !disabled && (
        <button
          type="button"
          onClick={onClear}
          className="absolute left-9 top-8 rounded-md text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-action-primary/30"
          aria-label="مسح الاختيار"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {error && <p className="mr-1 mt-1 text-xs text-danger">{error}</p>}
      {isOpen && !disabled && (
        <div className="absolute z-[70] mt-2 w-full overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
          <div className="flex items-center gap-2 border-b border-line p-2">
            <Search className="w-4 h-4 text-ink-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="بحث..."
              className="w-full bg-transparent text-right text-sm text-ink outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-sm text-ink-muted">لا توجد نتائج</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-right outline-none transition-colors hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:ring-2 focus-visible:ring-action-primary/30"
                >
                  <Check className={`w-4 h-4 ${value === option.value ? 'text-action-primary' : 'text-transparent'}`} />
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-ink">{option.label}</span>
                    {option.description && <span className="block text-xs text-ink-muted">{option.description}</span>}
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
  const [type, setType] = useState<MovementType>(defaultType)
  const [warehouseId, setWarehouseId] = useState(defaultWarehouseId ?? 0)
  const [toWarehouseId, setToWarehouseId] = useState(0)
  const [adjustmentDirection, setAdjustmentDirection] = useState<'increase' | 'decrease'>('increase')
  const [itemId, setItemId] = useState(0)
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [inlineError, setInlineError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const createMutation = useCreateMovement()
  const { data: warehousesData, isLoading: isWarehousesLoading } = useWarehouses(1, 100)
  const { data: itemsData, isLoading: isItemsLoading } = useItems(1, 100, true)
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
  const consumesStock = type === 'out' || type === 'transfer' || (type === 'adjustment' && adjustmentDirection === 'decrease')
  const exceedsBalance = consumesStock && itemId > 0 && warehouseId > 0 && quantityValue > availableBalance

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
    setToWarehouseId(0)
    setAdjustmentDirection('increase')
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

  const handleTypeChange = (nextType: MovementType) => {
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
      to_warehouse_id: type === 'transfer' ? toWarehouseId : undefined,
      item_id: itemId,
      quantity: Number(quantity),
      adjustment_direction: type === 'adjustment' ? adjustmentDirection : undefined,
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
            <p className="text-sm text-gray-500 mt-1">تسجيل وارد، صادر، تحويل، أو تسوية مع تحديث الرصيد مباشرة</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={handleClose} aria-label="إغلاق النافذة">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          <section>
            <label className="text-sm font-semibold text-gray-700 block mb-2">نوع الحركة</label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Button
                type="button"
                onClick={() => handleTypeChange('in')}
                variant={type === 'in' ? 'secondary' : 'outline'}
                size="lg"
                className="rounded-2xl border-2 text-lg font-bold"
              >
                وارد ←
              </Button>
              <Button
                type="button"
                onClick={() => handleTypeChange('out')}
                variant={type === 'out' ? 'danger' : 'outline'}
                size="lg"
                className="rounded-2xl border-2 text-lg font-bold"
              >
                → صادر
              </Button>
              <Button
                type="button"
                onClick={() => handleTypeChange('transfer')}
                variant={type === 'transfer' ? 'primary' : 'outline'}
                size="lg"
                className="rounded-2xl border-2 text-lg font-bold"
              >
                تحويل
              </Button>
              <Button
                type="button"
                onClick={() => handleTypeChange('adjustment')}
                variant={type === 'adjustment' ? 'secondary' : 'outline'}
                size="lg"
                className="rounded-2xl border-2 text-lg font-bold"
              >
                تسوية
              </Button>
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
            {type === 'transfer' ? (
              <SearchableCombobox
                label="إلى مستودع"
                value={toWarehouseId}
                options={warehouseOptions.filter((option) => option.value !== warehouseId)}
                placeholder={isWarehousesLoading ? 'جاري التحميل...' : 'اختر مستودع التحويل إليه'}
                disabled={isWarehousesLoading || createMutation.isPending}
                error={errors.to_warehouse_id}
                onChange={setToWarehouseId}
                onClear={() => setToWarehouseId(0)}
              />
            ) : null}
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

          {type === 'adjustment' ? (
            <section>
              <label className="text-sm font-semibold text-gray-700 block mb-2">اتجاه التسوية</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={() => setAdjustmentDirection('increase')}
                  variant={adjustmentDirection === 'increase' ? 'secondary' : 'outline'}
                  className="font-bold"
                >
                  زيادة الرصيد
                </Button>
                <Button
                  type="button"
                  onClick={() => setAdjustmentDirection('decrease')}
                  variant={adjustmentDirection === 'decrease' ? 'danger' : 'outline'}
                  className="font-bold"
                >
                  تخفيض الرصيد
                </Button>
              </div>
              {errors.adjustment_direction && <p className="text-xs text-red-600 mt-1 mr-1">{errors.adjustment_direction}</p>}
            </section>
          ) : null}

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
            <Button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isPending}
              variant="outline"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || exceedsBalance || isBalanceLoading}
              variant={type === 'out' || (type === 'adjustment' && adjustmentDirection === 'decrease') ? 'danger' : type === 'transfer' ? 'primary' : 'secondary'}
              isLoading={createMutation.isPending}
              className="font-bold"
            >
              {type === 'in' ? 'تسجيل وارد' : type === 'out' ? 'تسجيل صادر' : type === 'transfer' ? 'تسجيل تحويل' : 'تسجيل تسوية'}
            </Button>
          </div>
        </form>
      </div>
    </AppDialog>
  )
}
