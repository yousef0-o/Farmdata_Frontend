'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Warehouse as WarehouseIcon, Plus, Loader2, MapPin, ArrowLeftRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useWarehouses, useCreateWarehouse } from '@/lib/hooks/useInventory'
import Pagination from '@/components/ui/Pagination'

const warehouseSchema = z.object({
  name: z.string().min(1, 'اسم المستودع مطلوب'),
  location: z.string().optional(),
})

export default function WarehousesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data, isLoading } = useWarehouses(page)
  const createMutation = useCreateWarehouse()

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = warehouseSchema.safeParse({ name, location })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        const k = err.path[0] as string
        if (!fieldErrors[k]) fieldErrors[k] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    createMutation.mutate(
      { name, location: location || undefined },
      {
        onSuccess: () => {
          setName('')
          setLocation('')
          setShowCreate(false)
          setErrors({})
        },
      }
    )
  }

  // Gracefully handle both raw array response and standard PaginatedResponse
  const warehousesRaw = data
  const warehouses = Array.isArray(warehousesRaw)
    ? warehousesRaw
    : (warehousesRaw as any)?.data || []

  const meta = Array.isArray(warehousesRaw) ? null : (warehousesRaw as any)?.meta

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <WarehouseIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">المستودعات</h1>
            <p className="text-sm text-gray-500 mt-1">إدارة مستودعات المزرعة والأعلاف</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-farm-blue hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة مستودع</span>
        </button>
      </div>

      {/* Create Dialog / Form */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" dir="rtl">
            <h2 className="text-lg font-bold mb-4 text-gray-800">إضافة مستودع جديد</h2>
            
            {createMutation.error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {(createMutation.error as { message?: string })?.message ?? 'حدث خطأ أثناء إضافة المستودع'}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">اسم المستودع</label>
                <input
                  type="text"
                  placeholder="مثال: مستودع العلف الرئيسي"
                  className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue ${
                    errors.name ? 'border-red-500' : 'border-gray-200'
                  }`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                {errors.name && <p className="text-xs text-red-600 mt-1 mr-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">الموقع (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: الجناح الشمالي"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-farm-green hover:bg-green-700 text-white px-6 py-2 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false)
                    setErrors({})
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-xl font-medium transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main List Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
        </div>
      ) : warehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <WarehouseIcon className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">لا توجد مستودعات حالياً</h3>
          <p className="text-gray-500 mt-2">قم بإضافة مستودع جديد للبدء.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50/50">
                  <th className="text-right py-3 px-4 font-semibold">الاسم</th>
                  <th className="text-right py-3 px-4 font-semibold">الموقع</th>
                  <th className="text-right py-3 px-4 font-semibold w-40">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((wh: any) => (
                  <tr key={wh.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2">
                      <WarehouseIcon className="w-4 h-4 text-gray-400" />
                      {wh.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {wh.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {wh.location}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Link
                        href={`/warehouses/${wh.id}`}
                        className="text-xs bg-farm-blue/5 hover:bg-farm-blue/10 text-farm-blue px-3 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        عرض الأرصدة
                      </Link>
                      <Link
                        href={`/inventory/movements?warehouse_id=${wh.id}`}
                        className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        الحركات
                      </Link>
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
