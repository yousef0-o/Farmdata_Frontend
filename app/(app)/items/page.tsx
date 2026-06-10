'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Layers, Plus, Loader2, Package, Tag, ArrowLeftRight, Pencil, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useItems, useCreateItem, useUpdateItem, useDeleteItem } from '@/lib/hooks/useInventory'
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
  
  // Create Dialog States
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [category, setCategory] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Edit Dialog States
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  // Delete Dialog States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Selected Item Context
  const [selectedItem, setSelectedItem] = useState<any | null>(null)

  const { data, isLoading } = useItems(page)
  const createMutation = useCreateItem()
  const updateMutation = useUpdateItem()
  const deleteMutation = useDeleteItem()

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

    const randomCode = 'ITEM-' + Date.now().toString().slice(-6)
    createMutation.mutate(
      {
        name,
        unit: unit || 'كجم',
        category: category,
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

  const handleEditInit = (item: any) => {
    setSelectedItem(item)
    setEditName(item.name || '')
    setEditUnit(item.unit || '')
    setEditCategory(item.category || '')
    setEditIsActive(item.is_active !== false)
    setEditErrors({})
    setShowEdit(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setEditErrors({})

    const result = itemSchema.safeParse({ name: editName, unit: editUnit, category: editCategory })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        const k = err.path[0] as string
        if (!fieldErrors[k]) fieldErrors[k] = err.message
      })
      setEditErrors(fieldErrors)
      return
    }

    if (!selectedItem) return

    updateMutation.mutate(
      {
        id: selectedItem.id,
        data: {
          name: editName,
          unit: editUnit || 'كجم',
          category: editCategory,
          is_active: editIsActive,
        },
      },
      {
        onSuccess: () => {
          setSelectedItem(null)
          setEditName('')
          setEditUnit('')
          setEditCategory('')
          setEditIsActive(true)
          setShowEdit(false)
          setEditErrors({})
        },
      }
    )
  }

  const handleDeleteInit = (item: any) => {
    setSelectedItem(item)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = () => {
    if (!selectedItem) return

    deleteMutation.mutate(selectedItem.id, {
      onSuccess: () => {
        setSelectedItem(null)
        setShowDeleteConfirm(false)
      },
    })
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

      {/* Edit Dialog / Form */}
      {showEdit && (
        <AppDialog open={showEdit} onClose={() => { setShowEdit(false); setSelectedItem(null); setEditErrors({}); }} panelClassName="max-w-md">
          <div className="w-full rounded-2xl bg-surface p-6 shadow-xl" dir="rtl">
            <h2 className="mb-4 text-lg font-bold text-ink">تعديل الصنف</h2>

            {updateMutation.error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {(updateMutation.error as { message?: string })?.message ?? 'حدث خطأ أثناء تعديل الصنف'}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink-soft">اسم الصنف <span className="text-danger">*</span></label>
                <input
                  type="text"
                  placeholder="مثال: علف بادي 23%"
                  className={`w-full rounded-xl border px-4 py-2.5 bg-surface-muted focus:outline-none focus:ring-2 focus:ring-action-primary ${
                    editErrors.name ? 'border-red-500' : 'border-gray-200'
                  }`}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                {editErrors.name && <p className="text-xs text-red-600 mt-1 mr-1">{editErrors.name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-ink-soft">الوحدة (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: كجم، كرتونة، وحدة"
                  className="w-full rounded-xl border border-line bg-surface-muted px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-action-primary"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-ink-soft">الفئة <span className="text-danger">*</span></label>
                <select
                  className={`w-full rounded-xl border px-4 py-2.5 bg-surface-muted focus:outline-none focus:ring-2 focus:ring-action-primary ${
                    editErrors.category ? 'border-red-500' : 'border-gray-200'
                  }`}
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  <option value="">اختر الفئة...</option>
                  <option value="بيض منتج">بيض منتج</option>
                  <option value="أعلاف">أعلاف</option>
                  <option value="أدوية">أدوية</option>
                  <option value="أخرى">أخرى</option>
                </select>
                {editErrors.category && <p className="text-xs text-red-600 mt-1 mr-1">{editErrors.category}</p>}
              </div>

              <div className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  className="h-5 w-5 rounded border-gray-300 text-action-primary focus:ring-action-primary cursor-pointer"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                />
                <label htmlFor="editIsActive" className="text-sm font-semibold text-ink-soft select-none cursor-pointer">
                  الصنف نشط (يظهر في القوائم المنسدلة للعمليات اليومية)
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-action-secondary px-6 py-2 font-medium text-white transition-colors hover:bg-action-secondary-hover disabled:opacity-50"
                >
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEdit(false)
                    setSelectedItem(null)
                    setEditErrors({})
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

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <AppDialog open={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setSelectedItem(null); }} panelClassName="max-w-md">
          <div className="w-full rounded-2xl bg-surface p-6 shadow-xl" dir="rtl">
            <h2 className="mb-2 text-lg font-bold text-danger">تأكيد الحذف</h2>
            <p className="text-sm text-ink-soft mb-6">
              هل أنت متأكد من رغبتك في حذف الصنف <strong className="text-ink font-semibold">"{selectedItem?.name}"</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </p>

            {deleteMutation.error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-2xl text-sm space-y-3 border border-red-100 shadow-sm animate-in fade-in duration-200">
                <p className="font-semibold">{(deleteMutation.error as { message?: string })?.message ?? 'حدث خطأ أثناء حذف الصنف'}</p>
                <button
                  type="button"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    if (!selectedItem) return
                    updateMutation.mutate(
                      {
                        id: selectedItem.id,
                        data: {
                          name: selectedItem.name,
                          unit: selectedItem.unit || 'كجم',
                          category: selectedItem.category,
                          is_active: false,
                        },
                      },
                      {
                        onSuccess: () => {
                          setSelectedItem(null)
                          setShowDeleteConfirm(false)
                          deleteMutation.reset()
                        },
                      }
                    )
                  }}
                  className="w-full flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action-primary px-4 py-2 font-bold text-white transition-colors hover:bg-action-primary-hover disabled:opacity-50 shadow-sm"
                >
                  {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  إلغاء تنشيط الصنف بدلاً من ذلك
                </button>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                disabled={deleteMutation.isPending || updateMutation.isPending}
                onClick={handleDeleteConfirm}
                className="flex min-h-11 items-center gap-2 rounded-xl bg-danger px-6 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                تأكيد الحذف
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending || updateMutation.isPending}
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setSelectedItem(null)
                  deleteMutation.reset()
                }}
                className="min-h-11 rounded-xl bg-surface-muted px-4 py-2 font-medium text-ink-soft transition-colors hover:bg-surface-subtle disabled:opacity-50"
              >
                إلغاء
              </button>
            </div>
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
                  <th className="text-right py-3.5 px-4 font-semibold text-ink-soft">اسم الصنف</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-ink-soft">الوحدة</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-ink-soft">الفئة</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-ink-soft">الحالة</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-ink-soft w-64">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-line transition-colors hover:bg-surface-subtle">
                    <td className="py-2.5 px-4 font-medium text-ink flex items-center gap-2">
                      <Package className="w-4 h-4 text-ink-muted" />
                      {item.name}
                    </td>
                    <td className="py-2.5 px-4 text-ink-soft">
                      <span className="rounded-md bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-ink">
                        {item.unit || 'كجم'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-ink-soft">
                      {item.category ? (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-ink-muted" />
                          {item.category}
                        </span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-ink-soft">
                      {item.is_active !== false ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          نشط
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          غير نشط
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link
                          href={`/inventory/movements?item_id=${item.id}`}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-info-soft px-2.5 text-xs font-semibold text-action-primary transition-colors hover:bg-info-soft"
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>السجل</span>
                        </Link>
                        <button
                          onClick={() => handleEditInit(item)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-surface-muted px-2.5 text-xs font-semibold text-ink hover:bg-surface-subtle transition-colors"
                        >
                          <Pencil className="w-3 h-3 text-ink-soft" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => handleDeleteInit(item)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-danger-soft px-2.5 text-xs font-semibold text-danger hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>حذف</span>
                        </button>
                      </div>
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{item.name}</p>
                      {item.is_active !== false ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 animate-in fade-in duration-200">
                          نشط
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 animate-in fade-in duration-200">
                          غير نشط
                        </span>
                      )}
                    </div>
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

                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={`/inventory/movements?item_id=${item.id}`}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border border-info-soft bg-info-soft px-4 py-2 text-sm font-semibold text-action-primary"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    سجل الحركات
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditInit(item)}
                      className="flex-1 inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-surface-muted px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-subtle transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-ink-soft" />
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDeleteInit(item)}
                      className="flex-1 inline-flex min-h-11 items-center justify-center gap-1 rounded-xl bg-danger-soft px-4 py-2 text-sm font-semibold text-danger hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </button>
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
