'use client'

import React, { useState } from 'react'
import { Plus, Loader2, Trash2, Upload, Search, Truck, CheckCircle2, ShieldAlert } from 'lucide-react'
import {
  useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier,
  useBulkDeleteSuppliers, useToggleSuspendSupplier,
  useImportSuppliers, useSupplierStats
} from '@/lib/hooks/useSuppliers'
import SupplierTable from '@/components/suppliers/SupplierTable'
import SupplierStatCards from '@/components/suppliers/SupplierStatCards'
import SupplierForm from '@/components/suppliers/SupplierForm'
import SupplierImportDropzone from '@/components/suppliers/SupplierImportDropzone'
import type { Supplier } from '@/lib/types'

export default function SuppliersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedSuspended, setSelectedSuspended] = useState('')

  // Dialog states
  const [showUpsert, setShowUpsert] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [showImport, setShowImport] = useState(false)

  // Row selections for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Server-side form errors
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})

  // Import notification
  const [importNotification, setImportNotification] = useState<{ count: number; message: string } | null>(null)

  // API Hooks
  const { data: statsData } = useSupplierStats()
  const { data: suppliersData, isLoading, refetch } = useSuppliers(page, {
    is_suspended: selectedSuspended === 'suspended' ? true : selectedSuspended === 'active' ? false : undefined,
    search: search || undefined,
  })

  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier(editingSupplier?.id ?? 0)
  const deleteMutation = useDeleteSupplier()
  const bulkDeleteMutation = useBulkDeleteSuppliers()
  const toggleSuspendMutation = useToggleSuspendSupplier()
  const importMutation = useImportSuppliers()

  const suppliers = suppliersData?.data || []
  const meta = suppliersData?.meta

  // Handlers
  const handleOpenCreate = () => {
    setEditingSupplier(null)
    setServerErrors({})
    setShowUpsert(true)
  }

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setServerErrors({})
    setShowUpsert(true)
  }

  const handleUpsertSubmit = (data: Partial<Supplier>) => {
    setServerErrors({})
    const mutation = editingSupplier ? updateMutation : createMutation
    mutation.mutate(data, {
      onSuccess: () => {
        setShowUpsert(false)
        refetch()
      },
      onError: (err: any) => {
        if (err.errors) {
          const mapped: Record<string, string> = {}
          Object.keys(err.errors).forEach(k => { mapped[k] = err.errors[k][0] })
          setServerErrors(mapped)
        }
      },
    })
  }

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المورد نهائيًا؟')) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          refetch()
          setSelectedIds(prev => prev.filter(item => item !== id))
        },
      })
    }
  }

  const handleToggleSuspend = (id: number) => {
    toggleSuspendMutation.mutate(id, {
      onSuccess: () => {
        refetch()
      },
    })
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    if (confirm(`هل أنت متأكد من حذف ${selectedIds.length} موردين دفعة واحدة؟`)) {
      bulkDeleteMutation.mutate(selectedIds, {
        onSuccess: () => {
          setSelectedIds([])
          refetch()
        },
      })
    }
  }

  const handleImport = (file: File) => {
    importMutation.mutate(file, {
      onSuccess: (res) => {
        setImportNotification({ count: res.imported_count, message: res.message })
        setShowImport(false)
        refetch()
        setTimeout(() => setImportNotification(null), 5000)
      },
    })
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? suppliers.map((s: Supplier) => s.id) : [])
  }

  const handleSelectRow = (id: number, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(item => item !== id))
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 text-right">
          <div className="p-3 bg-quick-blue-bg text-quick-blue-text rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الموردين</h1>
            <p className="text-sm text-gray-500 mt-1">تتبع حسابات الموردين، التزامات الشراء، والتوريد للمستودعات</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setShowImport(true)}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-surface-muted px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-subtle"
          >
            <Upload className="w-5 h-5" />
            <span>استيراد موردين</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-action-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-action-primary-hover"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة مورد جديد</span>
          </button>
        </div>
      </div>

      {/* Import success notice */}
      {importNotification && (
        <div className="p-4 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <p className="font-semibold text-sm">{importNotification.message}</p>
            <p className="text-xs mt-0.5">عدد السجلات المستوردة والمحدثة: {importNotification.count.toLocaleString('en-US')}</p>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <SupplierStatCards stats={statsData} />

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        {/* Filters Toolbar */}
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث بكود المورد، الاسم، أو الهاتف..."
              className="min-h-11 w-full rounded-xl border border-line bg-surface-muted pl-4 pr-10 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-action-primary"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              className="min-h-11 rounded-xl border border-line bg-surface-muted px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-action-primary"
              value={selectedSuspended}
              onChange={(e) => { setSelectedSuspended(e.target.value); setPage(1) }}
            >
              <option value="">كافة الحالات</option>
              <option value="active">نشط</option>
              <option value="suspended">موقوف</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Banner */}
        {selectedIds.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-line bg-surface-inverse px-4 py-4 text-ink-inverse md:flex-row md:items-center md:justify-between md:px-6">
            <span className="text-xs">تم تحديد {selectedIds.length.toLocaleString('en-US')} موردين لإجراء عملية جماعية</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="flex min-h-11 items-center gap-1.5 rounded-xl bg-danger px-4 py-2 text-xs text-ink-inverse transition-colors disabled:opacity-50"
              >
                {bulkDeleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>حذف المحدد</span>
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <SupplierTable
          suppliers={suppliers}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onToggleSuspend={handleToggleSuspend}
          meta={meta}
          onPageChange={setPage}
        />
      </div>

      {/* Form Modal */}
      {showUpsert && (
        <SupplierForm
          editingSupplier={editingSupplier}
          onSubmit={handleUpsertSubmit}
          onClose={() => setShowUpsert(false)}
          isPending={createMutation.isPending || updateMutation.isPending}
          serverErrors={serverErrors}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <SupplierImportDropzone
          onImport={handleImport}
          isPending={importMutation.isPending}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
