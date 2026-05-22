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
      <div className="flex justify-between items-center">
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
          className="flex items-center gap-2 bg-farm-blue hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة حركة</span>
        </button>
      </div>

      <CreateMovementDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

      {/* Filter Bar */}
      <form onSubmit={handleSearch} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Warehouse Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">المستودع</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue"
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
            <label className="text-xs font-semibold text-gray-600 block mb-1">الصنف</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue"
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
            <label className="text-xs font-semibold text-gray-600 block mb-1">النوع</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue"
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
              className="flex-1 flex items-center justify-center gap-2 bg-farm-blue hover:bg-blue-800 text-white py-2 rounded-xl transition-all font-medium text-sm h-[38px]"
            >
              <Search className="w-4 h-4" />
              <span>بحث</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all text-sm h-[38px] w-[38px]"
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
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <ArrowLeftRight className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">لا توجد حركات مخزون مسجلة</h3>
          <p className="text-gray-500 mt-2">تأكد من الفلاتر المحددة أو قم بتسجيل العمليات اليومية.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50/50">
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
                  <tr key={mov.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {mov.created_at ? new Date(mov.created_at).toLocaleString('ar-EG') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <MovementTypeBadge type={mov.type} />
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {mov.item_name || `صنف #${mov.item_id}`}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {mov.warehouse_name || `مستودع #${mov.warehouse_id}`}
                    </td>
                    <td className={`py-3 px-4 font-bold ${mov.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                      {mov.type === 'in' ? '+' : '-'} {Number(mov.quantity).toFixed(3)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                        mov.reversal_of
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : mov.reference_type === 'manual'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getReferenceLabel(mov)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate" title={mov.notes}>
                      {mov.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && (
            <div className="p-4 border-t border-gray-100">
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
