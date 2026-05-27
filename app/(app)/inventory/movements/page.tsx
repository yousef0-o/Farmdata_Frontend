'use client'

import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeftRight, Search, Loader2, RefreshCw, Plus } from 'lucide-react'
import { useInventoryMovements, useWarehouses, useItems } from '@/lib/hooks/useInventory'
import { MovementTypeBadge } from '@/components/inventory/MovementTypeBadge'
import { CreateMovementDialog } from '@/components/inventory/CreateMovementDialog'
import Pagination from '@/components/ui/Pagination'
import type { InventoryMovement } from '@/lib/types'

const getReferenceLabel = (movement: InventoryMovement) => {
  if (movement.reversal_of) return `عكس حركة #${movement.reversal_of}`
  if (movement.reference_type === 'manual') return 'يدوي'
  if (movement.reference_type === 'feed_consumption_event')
    return `علف — قطيع #${movement.flock_id ?? '—'}`
  if (movement.reference_type === 'egg_production_event')
    return `بيض — قطيع #${movement.flock_id ?? '—'}`
  if (movement.reference_type) return movement.reference_type
  return '—'
}

export default function InventoryMovementsPage() {
  const searchParams = useSearchParams()

  // Read initial filter values from URL if present (e.g. from warehouses details or items links)
  const initialWarehouse = searchParams.get('warehouse_id') ? Number(searchParams.get('warehouse_id')) : undefined
  const initialItem = searchParams.get('item_id') ? Number(searchParams.get('item_id')) : undefined

  const [warehouseFilter, setWarehouseFilter] = useState<number | undefined>(initialWarehouse)
  const [itemFilter, setItemFilter] = useState<number | undefined>(initialItem)
  const [typeFilter, setTypeFilter] = useState<'in' | 'out' | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Internal form states
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(initialWarehouse ? String(initialWarehouse) : '')
  const [selectedItem, setSelectedItem] = useState<string>(initialItem ? String(initialItem) : '')
  const [selectedType, setSelectedType] = useState<string>('')

  // Query lookups for filter dropdowns
  const { data: warehousesData } = useWarehouses()
  const { data: itemsData } = useItems()

  const warehouses = Array.isArray(warehousesData) ? warehousesData : (warehousesData as any)?.data || []
  const items = Array.isArray(itemsData) ? itemsData : (itemsData as any)?.data || []

  // Final filters applied on "Search" (or initially loaded)
  const activeFilters = useMemo(() => {
    return {
      warehouse_id: warehouseFilter,
      item_id: itemFilter,
      type: typeFilter,
      page,
    }
  }, [warehouseFilter, itemFilter, typeFilter, page])

  const { data, isLoading } = useInventoryMovements(activeFilters)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setWarehouseFilter(selectedWarehouse ? Number(selectedWarehouse) : undefined)
    setItemFilter(selectedItem ? Number(selectedItem) : undefined)
    setTypeFilter(selectedType ? (selectedType as 'in' | 'out') : undefined)
    setPage(1)
  }

  const handleReset = () => {
    setSelectedWarehouse('')
    setSelectedItem('')
    setSelectedType('')
    setWarehouseFilter(undefined)
    setItemFilter(undefined)
    setTypeFilter(undefined)
    setPage(1)
  }

  // Gracefully handle both raw array response and standard PaginatedResponse
  const movementsRaw = data
  const movements = (Array.isArray(movementsRaw) ? movementsRaw : (movementsRaw as any)?.data || []) as InventoryMovement[]
  const meta = Array.isArray(movementsRaw) ? null : (movementsRaw as any)?.meta

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">سجل حركة المخزون</h1>
            <p className="text-sm text-gray-500 mt-1">دفتر الأستاذ العام لحركات الوارد والصادر بالمستودعات</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateDialog(true)}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-farm-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-800"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة حركة</span>
        </button>
      </div>

      <CreateMovementDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Filter Bar */}
      <form onSubmit={handleSearch} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4">
          {/* Warehouse Selector */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">المستودع</label>
            <select
              className="w-full rounded-xl border border-line bg-surface-muted px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
            >
              <option value="">الكل</option>
              {warehouses.map((wh: any) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>

          {/* Item Selector */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">الصنف</label>
            <select
              className="w-full rounded-xl border border-line bg-surface-muted px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
            >
              <option value="">الكل</option>
              {items.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Selector */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">النوع</label>
            <select
              className="w-full rounded-xl border border-line bg-surface-muted px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">الكل</option>
              <option value="in">وارد (In)</option>
              <option value="out">صادر (Out)</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-action-primary py-2 text-sm font-medium text-white transition-colors hover:bg-action-primary-hover"
            >
              <Search className="w-4 h-4" />
              <span>بحث</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-surface-muted p-2 text-sm text-ink-soft transition-colors hover:bg-surface-subtle"
              title="إعادة تعيين الفلاتر"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Main Ledger Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
        </div>
      ) : movements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface py-20">
          <ArrowLeftRight className="mb-4 h-16 w-16 text-ink-muted" />
          <h3 className="text-xl font-semibold text-ink-soft">لا توجد حركات مخزون مسجلة</h3>
          <p className="mt-2 text-ink-muted">تأكد من الفلاتر المحددة أو قم بتسجيل العمليات اليومية.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-subtle text-ink-soft">
                  <th className="text-right py-3 px-4 font-semibold">التاريخ</th>
                  <th className="text-right py-3 px-4 font-semibold">النوع</th>
                  <th className="text-right py-3 px-4 font-semibold">الصنف</th>
                  <th className="text-right py-3 px-4 font-semibold">المستودع</th>
                  <th className="text-right py-3 px-4 font-semibold">الكمية</th>
                  <th className="text-right py-3 px-4 font-semibold">المرجع</th>
                  <th className="text-right py-3 px-4 font-semibold">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mov) => (
                  <tr key={mov.id} className="border-b border-line transition-colors hover:bg-surface-subtle">
                    <td className="py-3 px-4 text-xs text-ink-soft">
                      {mov.created_at ? new Date(mov.created_at).toLocaleString('ar-EG') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <MovementTypeBadge type={mov.type} />
                    </td>
                    <td className="py-3 px-4 font-medium text-ink">
                      {mov.item_name || `صنف #${mov.item_id}`}
                    </td>
                    <td className="py-3 px-4 text-ink-soft">
                      {mov.warehouse_name || `مستودع #${mov.warehouse_id}`}
                    </td>
                    <td className={`py-3 px-4 font-bold ${mov.type === 'in' ? 'text-success' : 'text-danger'}`}>
                      {mov.type === 'in' ? '+' : '-'} {Number(mov.quantity).toFixed(3)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        mov.reversal_of
                          ? 'border border-warning-soft bg-warning-soft text-warning-strong'
                          : mov.reference_type === 'manual'
                            ? 'border border-info-soft bg-info-soft text-info'
                            : 'bg-surface-muted text-ink-soft'
                      }`}>
                        {getReferenceLabel(mov)}
                      </span>
                    </td>
                    <td className="max-w-xs truncate py-3 px-4 text-ink-muted" title={mov.notes}>
                      {mov.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
            {movements.map((mov) => (
              <article key={mov.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-ink">{mov.item_name || `صنف #${mov.item_id}`}</p>
                    <p className="text-xs text-ink-muted">{mov.warehouse_name || `مستودع #${mov.warehouse_id}`}</p>
                  </div>
                  <MovementTypeBadge type={mov.type} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-surface-subtle px-3 py-2">
                    <span className="block text-xs text-ink-muted">الكمية</span>
                    <span className={`font-semibold ${mov.type === 'in' ? 'text-success' : 'text-danger'}`}>
                      {mov.type === 'in' ? '+' : '-'} {Number(mov.quantity).toFixed(3)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-surface-subtle px-3 py-2">
                    <span className="block text-xs text-ink-muted">المرجع</span>
                    <span className="text-sm font-semibold text-ink">{getReferenceLabel(mov)}</span>
                  </div>
                  <div className="col-span-2 rounded-xl bg-surface-subtle px-3 py-2">
                    <span className="block text-xs text-ink-muted">التاريخ</span>
                    <span className="text-sm font-semibold text-ink">
                      {mov.created_at ? new Date(mov.created_at).toLocaleString('ar-EG') : '—'}
                    </span>
                  </div>
                  <div className="col-span-2 rounded-xl bg-surface-subtle px-3 py-2">
                    <span className="block text-xs text-ink-muted">ملاحظات</span>
                    <span className="text-sm text-ink-soft">{mov.notes || '—'}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {meta && (
            <div className="border-t border-line p-4">
              <Pagination
                currentPage={meta.current_page}
                lastPage={meta.last_page}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
