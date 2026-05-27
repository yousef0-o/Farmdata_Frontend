'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Warehouse as WarehouseIcon, Plus, Loader2, MapPin, ArrowLeftRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useWarehouses, useCreateWarehouse } from '@/lib/hooks/useInventory'
import { organizationApi } from '@/lib/api/organization'
import Pagination from '@/components/ui/Pagination'
import AppDialog from '@/components/ui/AppDialog'

const warehouseSchema = z.object({
  company_id: z.coerce.number({ message: 'الشركة مطلوبة' }).min(1, 'الشركة مطلوبة'),
  name: z.string().min(1, 'اسم المستودع مطلوب'),
  code: z.string().min(1, 'رمز المستودع مطلوب'),
  location: z.string().optional(),
})

export default function WarehousesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [companyId, setCompanyId] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [location, setLocation] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data, isLoading } = useWarehouses(page)
  const createMutation = useCreateWarehouse()

  // Query Companies for Selection
  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: organizationApi.listCompanies,
  })

  const companies = companiesData?.data ?? []

  // Auto-select company if there is only one
  React.useEffect(() => {
    if (companies.length === 1 && !companyId) {
      setCompanyId(String(companies[0].id))
    }
  }, [companies, companyId])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = warehouseSchema.safeParse({ company_id: companyId, name, code, location })
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
      { 
        company_id: Number(companyId),
        name, 
        code,
        location: location || undefined 
      },
      {
        onSuccess: () => {
          setName('')
          setCode('')
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action-primary px-5 py-2.5 font-medium text-white transition-colors hover:bg-action-primary-hover"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة مستودع</span>
        </button>
      </div>

      {/* Create Dialog / Form */}
      {showCreate && (
        <AppDialog open={showCreate} onClose={() => setShowCreate(false)} panelClassName="max-w-md">
          <div className="w-full rounded-2xl bg-surface p-6 shadow-xl" dir="rtl">
            <h2 className="mb-4 text-lg font-bold text-ink">إضافة مستودع جديد</h2>
            
            {createMutation.error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {(createMutation.error as { message?: string })?.message ?? 'حدث خطأ أثناء إضافة المستودع'}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink-soft">اختر الشركة <span className="text-danger">*</span></label>
                <select
                  className={`w-full rounded-xl border px-4 py-2.5 bg-surface-muted focus:outline-none focus:ring-2 focus:ring-action-primary ${
                    errors.company_id ? 'border-red-500' : 'border-gray-200'
                  }`}
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  disabled={isLoadingCompanies || createMutation.isPending}
                >
                  <option value="">اختر الشركة...</option>
                  {companies.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.company_id && <p className="text-xs text-red-600 mt-1 mr-1">{errors.company_id}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-ink-soft">اسم المستودع <span className="text-danger">*</span></label>
                <input
                  type="text"
                  placeholder="مثال: مستودع العلف الرئيسي"
                  className={`w-full rounded-xl border px-4 py-2.5 bg-surface-muted focus:outline-none focus:ring-2 focus:ring-action-primary ${
                    errors.name ? 'border-red-500' : 'border-gray-200'
                  }`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={createMutation.isPending}
                  autoFocus
                />
                {errors.name && <p className="text-xs text-red-600 mt-1 mr-1">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-ink-soft">رمز المستودع <span className="text-danger">*</span></label>
                <input
                  type="text"
                  placeholder="مثال: WH-FEED"
                  className={`w-full rounded-xl border px-4 py-2.5 bg-surface-muted focus:outline-none focus:ring-2 focus:ring-action-primary ${
                    errors.code ? 'border-red-500' : 'border-gray-200'
                  }`}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={createMutation.isPending}
                />
                {errors.code && <p className="text-xs text-red-600 mt-1 mr-1">{errors.code}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-ink-soft">الموقع (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: الجناح الشمالي"
                  className="w-full rounded-xl border border-line bg-surface-muted px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-action-primary"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={createMutation.isPending}
                />
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
                    setName('')
                    setCode('')
                    setLocation('')
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
      ) : warehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface py-20">
          <WarehouseIcon className="mb-4 h-16 w-16 text-ink-muted" />
          <h3 className="text-xl font-semibold text-ink-soft">لا توجد مستودعات حالياً</h3>
          <p className="mt-2 text-ink-muted">قم بإضافة مستودع جديد للبدء.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-subtle text-ink-soft">
                  <th className="text-right py-3 px-4 font-semibold">الاسم</th>
                  <th className="text-right py-3 px-4 font-semibold">الموقع</th>
                  <th className="text-right py-3 px-4 font-semibold w-40">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((wh: any) => (
                  <tr key={wh.id} className="border-b border-line transition-colors hover:bg-surface-subtle">
                    <td className="py-3 px-4 font-medium text-ink flex items-center gap-2">
                      <WarehouseIcon className="w-4 h-4 text-ink-muted" />
                      {wh.name}
                    </td>
                    <td className="py-3 px-4 text-ink-soft">
                      {wh.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-ink-muted" />
                          {wh.location}
                        </span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Link
                        href={`/warehouses/${wh.id}`}
                        className="min-h-11 text-xs bg-info-soft hover:bg-info-soft text-action-primary px-3 py-2 rounded-lg transition-colors font-medium inline-flex items-center"
                      >
                        عرض الأرصدة
                      </Link>
                      <Link
                        href={`/inventory/movements?warehouse_id=${wh.id}`}
                        className="min-h-11 text-xs bg-surface-muted hover:bg-surface-subtle text-ink-soft px-3 py-2 rounded-lg transition-colors font-medium inline-flex items-center gap-1"
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

          <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
            {warehouses.map((wh: any) => (
              <article key={wh.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-ink">{wh.name}</p>
                    <p className="text-xs text-ink-muted">{wh.location || '—'}</p>
                  </div>
                  <div className="rounded-xl bg-surface-subtle p-2 text-ink-muted">
                    <WarehouseIcon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/warehouses/${wh.id}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-info-soft bg-info-soft px-4 py-2 text-sm font-semibold text-action-primary"
                  >
                    عرض الأرصدة
                  </Link>
                  <Link
                    href={`/inventory/movements?warehouse_id=${wh.id}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-xl border border-line bg-surface-subtle px-4 py-2 text-sm font-semibold text-ink-soft"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    الحركات
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
