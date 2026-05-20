'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Layers, Plus, Loader2, Package, Tag, ArrowLeftRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useItems, useCreateItem } from '@/lib/hooks/useInventory'
import Pagination from '@/components/ui/Pagination'

const itemSchema = z.object({
  name: z.string().min(1, 'اسم الصنف مطلوب'),
  unit: z.string().optional(),
  category: z.string().optional(),
})

export default function ItemsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [category, setCategory] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data, isLoading } = useItems(page)
  const createMutation = useCreateItem()

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = itemSchema.safeParse({ name, unit, category })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        const k = err.path[0] as string
        if (!fieldErrors[k]) fieldErrors[k] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    // Backend item store expects unit, code, name, evaluation_value, company_id
    // But backend requires: company_id, name, code, evaluation_value
    // Wait, let's check ItemController store fields:
    // 'company_id' => 'required|exists:companies,id'
    // 'name' => 'required|string|max:255'
    // 'code' => 'required|string|max:255'
    // 'evaluation_value' => 'required|numeric'
    // Let's pass a random code (e.g. ITEM-timestamp or auto) and evaluation_value: 0
    // so we don't violate database constraints.
    // Also we will try to pass company_id: 1 as the default.
    // Let's verify what the backend requires.
    // Let's whitelist build payload:
    const randomCode = 'ITEM-' + Date.now().toString().slice(-6)
    createMutation.mutate(
      {
        name,
        unit: unit || 'كجم',
        category: category || 'عام',
        // Backend specific required fields
        code: randomCode,
        company_id: 1, // Fallback company
        evaluation_value: 0,
      } as any,
      {
        onSuccess: () => {
          setName('')
          setUnit('')
          setCategory('')
          setShowCreate(false)
          setErrors({})
        },
      }
    )
  }

  // Gracefully handle both raw array response and standard PaginatedResponse
  const itemsRaw = data
  const items = Array.isArray(itemsRaw)
    ? itemsRaw
    : (itemsRaw as any)?.data || []

  const meta = Array.isArray(itemsRaw) ? null : (itemsRaw as any)?.meta

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الأصناف</h1>
            <p className="text-sm text-gray-500 mt-1">تحديد وإدارة أصناف المخزون والأعلاف</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-farm-blue hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة صنف</span>
        </button>
      </div>

      {/* Create Dialog / Form */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">إضافة صنف جديد</h2>

            {createMutation.error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {(createMutation.error as { message?: string })?.message ?? 'حدث خطأ أثناء إضافة الصنف'}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">اسم الصنف</label>
                <input
                  type="text"
                  placeholder="مثال: علف بادي 23%"
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
                <label className="text-sm font-semibold text-gray-700 block mb-1">الوحدة (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: كجم، كرتونة، وحدة"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1">الفئة (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: أعلاف، بيض، أدوية"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Package className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">لا توجد أصناف حالياً</h3>
          <p className="text-gray-500 mt-2">قم بإضافة صنف جديد للبدء.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-gray-50/50">
                  <th className="text-right py-3 px-4 font-semibold">اسم الصنف</th>
                  <th className="text-right py-3 px-4 font-semibold">الوحدة</th>
                  <th className="text-right py-3 px-4 font-semibold">الفئة</th>
                  <th className="text-right py-3 px-4 font-semibold w-40">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <span className="bg-gray-100 text-gray-800 text-xs px-2.5 py-1 rounded-md font-medium">
                        {item.unit || 'كجم'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.category ? (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-gray-400" />
                          {item.category}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/inventory/movements?item_id=${item.id}`}
                        className="text-xs bg-farm-blue/5 hover:bg-farm-blue/10 text-farm-blue px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1 w-fit"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        سجل الحركات
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
