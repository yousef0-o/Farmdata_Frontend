'use client'

import React, { useState } from 'react'
import { Plus, Loader2, Trash2, Upload, Search, Coins, CheckCircle2 } from 'lucide-react'
import {
  useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset,
  useBulkDeleteAssets, useImportAssets, useAssetStats
} from '@/lib/hooks/useAssets'
import AssetTable from '@/components/assets/AssetTable'
import AssetStatCards from '@/components/assets/AssetStatCards'
import AssetWizardForm from '@/components/assets/AssetWizardForm'
import AssetImportDropzone from '@/components/assets/AssetImportDropzone'
import { CATEGORY_CONFIG } from '@/components/assets/AssetTypeBadge'
import { STATUS_CONFIG } from '@/components/assets/AssetStatusBadge'
import type { Asset } from '@/lib/types'

export default function AssetsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  // Dialog states
  const [showUpsert, setShowUpsert] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [showImport, setShowImport] = useState(false)

  // Row selections for bulk delete
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Server-side form errors
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})

  // Import notification
  const [importNotification, setImportNotification] = useState<{ count: number; message: string } | null>(null)

  // API
  const { data: statsData } = useAssetStats()
  const { data: assetsData, isLoading, refetch } = useAssets(page, {
    category: selectedCategory || undefined,
    status: selectedStatus || undefined,
    search: search || undefined,
  })

  const createMutation = useCreateAsset()
  const updateMutation = useUpdateAsset(editingAsset?.id ?? 0)
  const deleteMutation = useDeleteAsset()
  const bulkDeleteMutation = useBulkDeleteAssets()
  const importMutation = useImportAssets()

  const assets = assetsData?.data || []
  const meta = assetsData?.meta

  // Handlers
  const handleOpenCreate = () => {
    setEditingAsset(null)
    setServerErrors({})
    setShowUpsert(true)
  }

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset)
    setServerErrors({})
    setShowUpsert(true)
  }

  const handleUpsertSubmit = (data: Partial<Asset>) => {
    setServerErrors({})
    const mutation = editingAsset ? updateMutation : createMutation
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
    if (confirm('هل أنت متأكد من حذف هذا الأصل؟')) {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          refetch()
          setSelectedIds(prev => prev.filter(item => item !== id))
        },
      })
    }
  }

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return
    if (confirm(`هل أنت متأكد من حذف ${selectedIds.length} أصول دفعة واحدة؟`)) {
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
    setSelectedIds(checked ? assets.map((a: Asset) => a.id) : [])
  }

  const handleSelectRow = (id: number, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(item => item !== id))
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-quick-blue-bg text-quick-blue-text rounded-xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الأصول الرأسمالية</h1>
            <p className="text-sm text-gray-500 mt-1">تتبع الحسابات الختامية، قيود الإهلاك، وهيكل فرز الأصول للمزرعة</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-250 text-gray-600 px-5 py-2.5 rounded-xl transition-all font-medium"
          >
            <Upload className="w-5 h-5" />
            <span>استيراد أصول</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-farm-blue hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة أصل جديد</span>
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
      <AssetStatCards stats={statsData} />

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث بكود الأصل أو الاسم..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue"
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1) }}
            >
              <option value="">كافة الفئات</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, c]) => (
                <option key={key} value={key}>{c.label}</option>
              ))}
            </select>
            <select
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-farm-blue"
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1) }}
            >
              <option value="">كافة الحالات</option>
              {Object.entries(STATUS_CONFIG).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk delete banner */}
        {selectedIds.length > 0 && (
          <div className="bg-gray-950 text-white px-6 py-3.5 flex items-center justify-between border-b border-gray-950">
            <span className="text-xs">تم تحديد {selectedIds.length.toLocaleString('en-US')} أصول للمحو</span>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="flex items-center gap-1.5 bg-red-650 hover:bg-red-700 text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-50 text-white"
            >
              {bulkDeleteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>حذف المحدد</span>
            </button>
          </div>
        )}

        {/* Table */}
        <AssetTable
          assets={assets}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          meta={meta}
          onPageChange={setPage}
        />
      </div>

      {/* Wizard Form Modal */}
      {showUpsert && (
        <AssetWizardForm
          editingAsset={editingAsset}
          onSubmit={handleUpsertSubmit}
          onClose={() => setShowUpsert(false)}
          isPending={createMutation.isPending || updateMutation.isPending}
          serverErrors={serverErrors}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <AssetImportDropzone
          onImport={handleImport}
          isPending={importMutation.isPending}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  )
}
