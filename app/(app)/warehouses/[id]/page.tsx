'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Warehouse as WarehouseIcon, MapPin, ArrowLeft, ArrowLeftRight, Loader2, Info, Plus } from 'lucide-react'
import { useWarehouse, useWarehouseBalances } from '@/lib/hooks/useInventory'
import { CreateMovementDialog } from '@/components/inventory/CreateMovementDialog'

export default function WarehouseDetailPage() {
  const { id } = useParams()
  const warehouseId = Number(id)
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)

  const { data: warehouseData, isLoading: isWarehouseLoading, error: warehouseError } = useWarehouse(warehouseId)
  const { data: balancesData, isLoading: isBalancesLoading, error: balancesError } = useWarehouseBalances(warehouseId)

  const warehouse = warehouseData?.data
  const balances = balancesData?.data ?? []

  const isLoading = isWarehouseLoading || isBalancesLoading

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (warehouseError || !warehouse) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-lg mx-auto" dir="rtl">
        <WarehouseIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">المستودع غير موجود</h3>
        <p className="text-sm text-gray-500 mb-6">يرجى التأكد من معرف المستودع والمحاولة مرة أخرى.</p>
        <Link
          href="/warehouses"
          className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة للمستودعات
        </Link>
      </div>
    )
  }

  // Gracefully handle 404 or other errors for stock balances endpoint
  const isBalancesUnavailable = !!balancesError

  return (
    <div className="space-y-6" dir="rtl">
      {/* Breadcrumb / Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/warehouses" className="hover:text-gray-700">المستودعات</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{warehouse.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
            {warehouse.location && (
              <span className="flex items-center gap-1 text-sm bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                <MapPin className="w-3.5 h-3.5" />
                {warehouse.location}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حركة لهذا المستودع</span>
          </button>
          <Link
            href={`/inventory/movements?warehouse_id=${warehouseId}`}
            className="flex items-center gap-2 bg-farm-blue hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl transition-colors font-medium text-sm"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>عرض حركات هذا المستودع</span>
          </Link>
          <Link
            href="/warehouses"
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للقائمة</span>
          </Link>
        </div>
      </div>

      <CreateMovementDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        defaultWarehouseId={warehouseId}
      />

      {/* Stock Balances Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">أرصدة المخزون الحالية</h2>

        {isBalancesUnavailable ? (
          <div className="p-6 bg-amber-50 border-r-4 border-amber-500 rounded-xl text-amber-800 flex items-start gap-3">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">الأرصدة غير متاحة حالياً</h4>
              <p className="text-xs text-amber-700 mt-1">
                حدثت مشكلة أثناء تحميل الأرصدة أو أن هذا الخيار غير مدعوم على الخادم حالياً. يرجى مراجعة مدير النظام.
              </p>
            </div>
          </div>
        ) : balances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <WarehouseIcon className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">لا توجد أرصدة مسجلة لهذا المستودع</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50/50">
                  <th className="text-right py-3 px-4 font-semibold">الصنف</th>
                  <th className="text-right py-3 px-4 font-semibold">الكمية المتاحة</th>
                  <th className="text-right py-3 px-4 font-semibold">آخر تحديث</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((bal, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{bal.item_name}</td>
                    <td className="py-3 px-4 font-bold text-farm-blue">
                      {Number(bal.quantity_on_hand).toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {bal.updated_at ? new Date(bal.updated_at).toLocaleString('ar-EG') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
