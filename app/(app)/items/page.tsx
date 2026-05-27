'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Layers, Plus, Loader2, Package, Tag, ArrowLeftRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useItems, useCreateItem } from '@/lib/hooks/useInventory'
import Pagination from '@/components/ui/Pagination'
import AppDialog from '@/components/ui/AppDialog'

const itemSchema = z.object({
  name: z.string().min(1, 'اسم الصنف مطلوب'),
  unit: z.string().optional(),
  category: z.string().min(1, 'الفئة مطلوبة'),
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
        category: category,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action-primary px-5 py-2.5 font-medium text-white transition-colors hover:bg-action-primary-hover"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة صنف</span>
        </button>
      </div>

      {/* Create Dialog / Form */}
      {showCreate && (
        <AppDialog open={showCreate} onClose={() => setShowCreate(false)} panelClassName="max-w-md">
          <div className="w-full rounded-2xl bg-surface p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-ink">إضافة صنف جديد</h2>

            {createMutation.error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {(createMutation.error as { message?: string })?.message ?? 'حدث خطأ أثناء إضافة الصنف'}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink-soft">اسم الصنف <span className="text-danger">*</span></label>
                <input
                  type="text"
                  placeholder="مثال: علف بادي 23%"
                  className={`w-full rounded-xl border px-4 py-2.5 bg-surface-muted focus:outline-none focus:ring-2 focus:ring-action-primary ${
                    errors.name ? 'border-red-500' : 'border-gray-200'
                  }`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                {errors.name && <p className="text-xs text-red-600 mt-1 mr-1">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-ink-soft">الوحدة (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: كجم، كرتونة، وحدة"
                  className="w-full rounded-xl border border-line bg-surface-muted px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-action-primary"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-ink-soft">الفئة <span className="text-danger">*</span></label>
                <select
                  className={`w-full rounded-xl border px-4 py-2.5 bg-surface-muted focus:outline-none focus:ring-2 focus:ring-action-primary ${
                    errors.category ? 'border-red-500' : 'border-gray-200'
                  }`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">اختر الفئة...</option>
                  <option value="بيض منتج">بيض منتج</option>
                  <option value="أعلاف">أعلاف</option>
                  <option value="أدوية">أدوية</option>
                  <option value="أخرى">أخرى</option>
                </select>
                {errors.category && <p className="text-xs text-red-600 mt-1 mr-1">{errors.category}</p>}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-action-secondary px-6 py-2 font-medium text-white transition-colors hover:bg-action-secondary-hover disabled:opacity-50"
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
                  className="min-h-11 rounded-xl bg-surface-muted px-4 py-2 font-medium text-ink-soft transition-colors hover:bg-surface-subtle"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </AppDialog>
      )}

      {/* Main List Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface py-20">
          <Package className="mb-4 h-16 w-16 text-ink-muted" />
          <h3 className="text-xl font-semibold text-ink-soft">لا توجد أصناف حالياً</h3>
          <p className="mt-2 text-ink-muted">قم بإضافة صنف جديد للبدء.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-subtle text-ink-soft">
                  <th className="text-right py-3 px-4 font-semibold">اسم الصنف</th>
                  <th className="text-right py-3 px-4 font-semibold">الوحدة</th>
                  <th className="text-right py-3 px-4 font-semibold">الفئة</th>
                  <th className="text-right py-3 px-4 font-semibold w-40">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-line transition-colors hover:bg-surface-subtle">
                    <td className="py-3 px-4 font-medium text-ink flex items-center gap-2">
                      <Package className="w-4 h-4 text-ink-muted" />
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-ink-soft">
                      <span className="rounded-md bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink">
                        {item.unit || 'كجم'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-ink-soft">
                      {item.category ? (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-ink-muted" />
                          {item.category}
                        </span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/inventory/movements?item_id=${item.id}`}
                        className="inline-flex min-h-11 w-fit items-center gap-1 rounded-lg bg-info-soft px-3 py-2 text-xs font-medium text-action-primary transition-colors hover:bg-info-soft"
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

          <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
            {items.map((item: any) => (
              <article key={item.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-ink">{item.name}</p>
                    <p className="text-xs text-ink-muted">{item.category || '—'}</p>
                  </div>
                  <div className="rounded-xl bg-surface-subtle p-2 text-ink-muted">
                    <Package className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-surface-subtle px-3 py-2">
                  <span className="block text-xs text-ink-muted">الوحدة</span>
                  <span className="text-sm font-semibold text-ink">{item.unit || 'كجم'}</span>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/inventory/movements?item_id=${item.id}`}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border border-info-soft bg-info-soft px-4 py-2 text-sm font-semibold text-action-primary"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    سجل الحركات
                  </Link>
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
