'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  useNode,
  useNodeBreadcrumb,
  useFolderSchema,
  useUpdateSchema,
  useFolderItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useBulkDeleteItems,
  useUploadAttachment,
  useDeleteAttachment,
  useFolderStatsConfigs,
  useCreateStatsConfig,
  useStatsResult,
  useRecalculateStats
} from '@/lib/hooks/useArchive'
import { archiveApi } from '@/lib/api/archive'
import {
  Folder,
  ChevronRight,
  Plus,
  Search,
  Settings,
  Trash2,
  Paperclip,
  FileSpreadsheet,
  ScanFace,
  Loader2,
  AlertCircle,
  X,
  Eye,
  ArrowDownToLine,
  Activity,
  CheckCircle,
  HelpCircle
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function FolderDetailPage({ params }: PageProps) {
  const { id: rawId } = React.use(params)
  const folderId = parseInt(rawId)

  // Navigation & Node data
  const { data: folderRes } = useNode(folderId)
  const { data: breadcrumbRes } = useNodeBreadcrumb(folderId)
  const breadcrumbs = breadcrumbRes?.data ?? []

  // Custom Schema Queries/Mutations
  const { data: schemaRes, isLoading: loadingSchema } = useFolderSchema(folderId)
  const updateSchemaMutation = useUpdateSchema(folderId)
  const [isEditingSchema, setIsEditingSchema] = useState(false)
  const [schemaColumns, setSchemaColumns] = useState<any[]>([])

  // Items / Documents Queries/Mutations
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const { data: itemsRes, isLoading: loadingItems } = useFolderItems(folderId, { search: searchTerm, page })
  const createItemMutation = useCreateItem(folderId)
  const updateItemMutation = useUpdateItem(folderId)
  const deleteItemMutation = useDeleteItem(folderId)
  const bulkDeleteMutation = useBulkDeleteItems(folderId)

  const items = itemsRes?.data ?? []
  const schema = schemaRes?.data
  const columns = schema?.columns ?? []

  // Dynamic Row Drawer
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isRowDrawerOpen, setIsRowDrawerOpen] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [streamingAttachmentUrl, setStreamingAttachmentUrl] = useState<string | null>(null)

  // Item Form Modal
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [itemFormValues, setItemFormValues] = useState<Record<string, any>>({})
  const [itemFormError, setItemFormError] = useState('')

  // Multi-Select Bulk state
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([])

  // Dynamic KPI Stats configs
  const { data: statsConfigsRes } = useFolderStatsConfigs(folderId)
  const createStatsMutation = useCreateStatsConfig(folderId)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [statsName, setStatsName] = useState('')
  const [statsChartType, setStatsChartType] = useState<'card' | 'bar'>('card')
  const [statsAgg, setStatsAgg] = useState<'count' | 'sum_total' | 'avg'>('count')
  const [statsCol, setStatsCol] = useState('')

  // Excel mapping pipeline
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [showExcelModal, setShowExcelModal] = useState(false)
  const [fuzzyMappings, setFuzzyMappings] = useState<Record<string, string>>({})
  const [excelHeaders, setExcelHeaders] = useState<string[]>([])
  const [excelImportLoading, setExcelImportLoading] = useState(false)

  // Scanner Pipeline
  const [scanFiles, setScanFiles] = useState<FileList | null>(null)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<string>('')
  const [jobProcessedCount, setJobProcessedCount] = useState<number>(0)
  const [scanningLoading, setScanningLoading] = useState(false)

  // Sync schema states when loaded
  useEffect(() => {
    if (schema) {
      setSchemaColumns(schema.columns)
    }
  }, [schema])

  // Poll Scanner Job status
  useEffect(() => {
    if (!activeJobId) return

    const interval = setInterval(async () => {
      try {
        const res = await archiveApi.getScannerJobStatus(folderId, activeJobId)
        setJobStatus(res.status)
        setJobProcessedCount(res.processed_count)
        if (res.status === 'completed' || res.status === 'failed') {
          setActiveJobId(null)
          setScanningLoading(false)
          // refresh items list
          window.location.reload()
        }
      } catch (err) {
        console.error(err)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [activeJobId, folderId])

  // --- Actions ---
  const handleSaveSchema = async () => {
    try {
      await updateSchemaMutation.mutateAsync({ columns: schemaColumns })
      setIsEditingSchema(false)
    } catch (err: any) {
      alert('حدث خطأ أثناء حفظ النموذج: ' + (err?.message ?? ''))
    }
  }

  const handleAddColumn = () => {
    setSchemaColumns([
      ...schemaColumns,
      { key: `col_${Date.now()}`, label: 'عمود جديد', type: 'text', required: false, searchable: true }
    ])
  }

  const handleRemoveColumn = (index: number) => {
    setSchemaColumns(schemaColumns.filter((_, idx) => idx !== index))
  }

  const handleUpdateColumnField = (index: number, field: string, value: any) => {
    const updated = [...schemaColumns]
    updated[index] = { ...updated[index], [field]: value }
    setSchemaColumns(updated)
  }

  // Row Add / Edit modal open
  const handleOpenItemForm = (item?: any) => {
    setItemFormError('')
    if (item) {
      setEditingItem(item)
      setItemFormValues(item.data)
    } else {
      setEditingItem(null)
      const defaults: Record<string, any> = {}
      columns.forEach(col => {
        defaults[col.key] = col.type === 'number' ? '' : ''
      })
      setItemFormValues(defaults)
    }
    setShowItemModal(true)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setItemFormError('')

    // Validate required fields
    for (const col of columns) {
      if (col.required && (itemFormValues[col.key] === undefined || itemFormValues[col.key] === '')) {
        setItemFormError(`الحقل "${col.label}" مطلوب ويجب تعبئته.`)
        return
      }
    }

    try {
      if (editingItem) {
        await updateItemMutation.mutateAsync({
          itemId: editingItem.id,
          data: { data: itemFormValues }
        })
      } else {
        await createItemMutation.mutateAsync({
          data: itemFormValues
        })
      }
      setShowItemModal(false)
    } catch (err: any) {
      setItemFormError(err?.message || 'فشل حفظ السجل المالي.')
    }
  }

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا السجل؟')) return
    try {
      await deleteItemMutation.mutateAsync(itemId)
      setIsRowDrawerOpen(false)
    } catch (err: any) {
      alert('حدث خطأ أثناء الحذف: ' + err?.message)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRowIds.length === 0) return
    if (!confirm(`هل أنت متأكد من حذف ${selectedRowIds.length} من السجلات المحددة؟`)) return

    try {
      await bulkDeleteMutation.mutateAsync(selectedRowIds)
      setSelectedRowIds([])
    } catch (err: any) {
      alert('فشل الحذف الجماعي: ' + err?.message)
    }
  }

  // Attachment upload
  const handleUploadAttachment = async () => {
    if (!attachmentFile || !selectedItem) return
    setUploadingAttachment(true)

    const fd = new FormData()
    fd.append('file', attachmentFile)
    fd.append('attachable_type', 'item')
    fd.append('attachable_id', selectedItem.id.toString())

    try {
      const res = await archiveApi.uploadAttachment(fd)
      // append attachment to current selected item mock for instant UI repaint
      const updatedItem = {
        ...selectedItem,
        attachments: [...(selectedItem.attachments ?? []), res.data]
      }
      setSelectedItem(updatedItem)
      setAttachmentFile(null)
    } catch (err: any) {
      alert('فشل رفع الملف: ' + err?.message)
    } finally {
      setUploadingAttachment(false)
    }
  }

  const handleDeleteAttachment = async (attachId: number) => {
    if (!confirm('هل تريد حذف هذا المرفق بشكل نهائي؟')) return
    try {
      await archiveApi.deleteAttachment(attachId)
      const updatedItem = {
        ...selectedItem,
        attachments: (selectedItem.attachments ?? []).filter((a: any) => a.id !== attachId)
      }
      setSelectedItem(updatedItem)
      if (streamingAttachmentUrl?.includes(`/attachments/${attachId}/`)) {
        setStreamingAttachmentUrl(null)
      }
    } catch (err: any) {
      alert('فشل الحذف: ' + err?.message)
    }
  }

  // Add Stats Config
  const handleCreateStatsConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!statsName.trim()) return

    try {
      await createStatsMutation.mutateAsync({
        name: statsName.trim(),
        chart_type: statsChartType,
        aggregation: statsAgg,
        column_key: statsCol || undefined
      })
      setShowStatsModal(false)
    } catch (err: any) {
      alert('فشل إضافة كرت الإحصائية: ' + err?.message)
    }
  }

  // Excel mapping trigger
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setExcelFile(file)

    const fd = new FormData()
    fd.append('file', file)

    try {
      const proposal = await archiveApi.getImportMappingProposal(folderId, fd)
      setFuzzyMappings(proposal)
      setExcelHeaders(Object.keys(proposal))
      setShowExcelModal(true)
    } catch (err: any) {
      alert('فشل قراءة ملف الإكسل: ' + err?.message)
    }
  }

  const handleConfirmExcelImport = async () => {
    if (!excelFile) return
    setExcelImportLoading(true)

    const fd = new FormData()
    fd.append('file', excelFile)
    fd.append('mapping', JSON.stringify(fuzzyMappings))

    try {
      const res = await archiveApi.executeImport(folderId, fd)
      alert(`تم استيراد ${res.data.inserted} من السجلات بنجاح!`)
      setShowExcelModal(false)
      setExcelFile(null)
      window.location.reload()
    } catch (err: any) {
      alert('حدث خطأ أثناء الاستيراد: ' + (err?.message ?? ''))
    } finally {
      setExcelImportLoading(false)
    }
  }

  // OCR upload pipeline
  const handleScannerUpload = async () => {
    if (!scanFiles || scanFiles.length === 0) return
    setScanningLoading(true)

    const fd = new FormData()
    for (let i = 0; i < scanFiles.length; i++) {
      fd.append('files[]', scanFiles[i])
    }

    try {
      const res = await archiveApi.uploadScans(folderId, fd)
      setActiveJobId(res.job_id)
      setJobStatus('pending')
      setJobProcessedCount(0)
    } catch (err: any) {
      alert('فشل تشغيل المعالجة الآلية: ' + err?.message)
      setScanningLoading(false)
    }
  }

  // Stats Card Component for inline calculations
  const StatsCard = ({ config }: { config: any }) => {
    const { data: resultRes, isLoading } = useStatsResult(folderId, config.id)
    if (isLoading) return <div className="h-28 bg-[#ffffff] dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-farm-blue" /></div>
    const val = resultRes?.results?.value ?? 0

    return (
      <div className="flex items-center justify-between p-6 bg-[#ffffff] dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
        <div>
          <span className="text-xs text-gray-400 font-semibold">{config.name}</span>
          <h4 className="text-xl font-bold text-gray-800 dark:text-[#ffffff] font-sans mt-1.5">
            {typeof val === 'number' ? val.toLocaleString('ar-EG', { maximumFractionDigits: 2 }) : val}
          </h4>
        </div>
        <div className="p-3 bg-brand-logo-bg rounded-xl text-brand-logo-icon">
          <Activity className="w-5 h-5" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Breadcrumb Header */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Link href="/archive" className="hover:text-farm-blue font-semibold">الأرشيف الرئيسي</Link>
        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/archive" className="hover:text-farm-blue font-semibold">
              <span>{crumb.name}</span>
            </Link>
          </React.Fragment>
        ))}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-bold text-farm-blue">{folderRes?.data?.name ?? 'المجلد الحالي'}</span>
      </div>

      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#ffffff] dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-2xl shadow-sm">
            <Folder className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-[#ffffff] font-sans">
              {folderRes?.data?.name ?? 'سجلات المجلد المالي'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">تخصيص الحقول، استيراد جداول البيانات، والمعالجة بالذكاء الاصطناعي</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Custom Schema Settings */}
          <button
            onClick={() => setIsEditingSchema(!isEditingSchema)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border font-semibold text-xs transition-all active:scale-[0.98] ${
              isEditingSchema
                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-200 dark:border-amber-900'
                : 'bg-[#ffffff] dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-4 h-4 animate-spin-slow" />
            <span>{isEditingSchema ? 'إلغاء ضبط الحقول' : 'ضبط حقول البيانات'}</span>
          </button>

          {/* Add item */}
          <button
            onClick={() => handleOpenItemForm()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-farm-blue text-[#ffffff] font-bold text-xs rounded-xl shadow-md hover:bg-opacity-90 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سجل مالي</span>
          </button>
        </div>
      </div>

      {/* Dynamic KPI Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {statsConfigsRes?.data?.map((config) => (
          <StatsCard key={config.id} config={config} />
        ))}

        {/* Add Stats Card Button */}
        <button
          onClick={() => {
            setStatsName('')
            setStatsCol('')
            setShowStatsModal(true)
          }}
          className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-farm-blue rounded-2xl text-gray-500 hover:text-farm-blue transition-all group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold font-sans">إضافة بطاقة إحصائيات</span>
        </button>
      </div>

      {/* Excel & OCR Pipeline Actions Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Excel Pipeline Panel */}
        <div className="p-6 bg-[#ffffff] dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
            <h3 className="text-sm font-bold font-sans">معالجة واستيراد جداول البيانات الذكية (Excel)</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            ارفع ملف إكسل مباشرة. سيقوم النظام بتحليل الترويسات ومطابقتها ذكياً مع حقول هذا المجلد المالي باستخدام التوافق التقريبي للحروف والترجمات.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-[#ffffff] cursor-pointer transition-all">
              <span>اختر ملف Excel</span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} className="hidden" />
            </label>
            
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'}/archive/folders/${folderId}/export`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>تصدير السجلات الحالية</span>
            </a>
          </div>
        </div>

        {/* OCR Scanner Pipeline Panel */}
        <div className="p-6 bg-[#ffffff] dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <ScanFace className="w-5 h-5" />
            <h3 className="text-sm font-bold font-sans">المعالجة بالذكاء الاصطناعي والاستخراج الضوئي (OCR)</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            قم برفع حزمة من المستندات الممسوحة ضوئياً (PDF/صور). سيقوم محرك القراءة في الخلفية بالاستخراج الذكي للقيم وتطابقها لحفظ السجلات تلقائياً.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
            <input
              type="file"
              multiple
              accept="application/pdf,image/*"
              onChange={(e) => setScanFiles(e.target.files)}
              className="text-xs text-gray-500 border border-gray-200 dark:border-gray-800 p-1.5 rounded-lg w-full max-w-xs"
            />
            <button
              onClick={handleScannerUpload}
              disabled={scanningLoading || !scanFiles}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-[#ffffff] font-bold text-xs rounded-xl shadow disabled:opacity-50 transition-all"
            >
              {scanningLoading ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري معالجة {jobProcessedCount} ملف...</span>
                </span>
              ) : (
                'بدء الاستخراج الآلي'
              )}
            </button>
          </div>

          {activeJobId && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 rounded-xl flex items-center justify-between text-xs">
              <span className="text-purple-700 dark:text-purple-400 font-semibold animate-pulse">
                حالة الاستخراج: {jobStatus === 'pending' ? 'انتظار' : 'جاري الفحص المتقدم للمحتوى'}
              </span>
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Schema Columns Builder Editor Panel */}
      {isEditingSchema && (
        <div className="p-6 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 dark:text-[#ffffff] font-sans">تعديل هيكل حقول البيانات والمستندات</h3>
            <button
              onClick={handleAddColumn}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-[#ffffff] text-xs font-bold rounded-lg hover:bg-opacity-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حقل جديد</span>
            </button>
          </div>

          <div className="space-y-3">
            {schemaColumns.map((col, index) => (
              <div key={col.key || index} className="flex flex-wrap items-center gap-3 p-3 bg-[#ffffff] dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-xl text-xs shadow-sm">
                <div className="w-full sm:w-40">
                  <label className="block text-[10px] text-gray-400 font-semibold mb-1">اسم الحقل (العربي)</label>
                  <input
                    type="text"
                    value={col.label}
                    onChange={(e) => handleUpdateColumnField(index, 'label', e.target.value)}
                    className="w-full p-2 border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-800 rounded-lg focus:outline-none dark:text-[#ffffff]"
                  />
                </div>

                <div className="w-full sm:w-40">
                  <label className="block text-[10px] text-gray-400 font-semibold mb-1">المعرف البرمجي (لاتيني)</label>
                  <input
                    type="text"
                    value={col.key}
                    onChange={(e) => handleUpdateColumnField(index, 'key', e.target.value)}
                    className="w-full p-2 border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-800 rounded-lg focus:outline-none dark:text-[#ffffff]"
                  />
                </div>

                <div className="w-full sm:w-32">
                  <label className="block text-[10px] text-gray-400 font-semibold mb-1">نوع البيانات</label>
                  <select
                    value={col.type}
                    onChange={(e) => handleUpdateColumnField(index, 'type', e.target.value)}
                    className="w-full p-2 border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-800 rounded-lg focus:outline-none dark:text-[#ffffff]"
                  >
                    <option value="text">نص (Text)</option>
                    <option value="number">رقم (Number)</option>
                    <option value="date">تاريخ (Date)</option>
                    <option value="select">قائمة خيارات (Select)</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-4 sm:pt-0">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!col.required}
                      onChange={(e) => handleUpdateColumnField(index, 'required', e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>إجباري</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!col.searchable}
                      onChange={(e) => handleUpdateColumnField(index, 'searchable', e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>قابل للبحث</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveColumn(index)}
                  className="sm:mr-auto p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-amber-200/50">
            <button
              onClick={() => setIsEditingSchema(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveSchema}
              disabled={updateSchemaMutation.isPending}
              className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 text-[#ffffff] text-xs font-bold rounded-lg hover:bg-amber-700"
            >
              {updateSchemaMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>حفظ التعديلات الحقلية</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Tabular Document Ledger View */}
      <div className="bg-[#ffffff] dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Grid Filters Bar */}
        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="بحث في السجلات..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="w-full pl-4 pr-10 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-farm-blue dark:text-[#ffffff]"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3.5 top-3" />
          </div>

          {selectedRowIds.length > 0 && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-gray-500 font-semibold">
                تم تحديد <span className="text-red-500 font-bold">{selectedRowIds.length}</span> من السجلات
              </span>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف المحدد</span>
              </button>
            </div>
          )}
        </div>

        {/* Responsive Table Grid */}
        <div className="overflow-x-auto">
          {loadingItems ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
              <span className="text-gray-500 text-sm mt-3 font-semibold">جاري تحميل السجلات المالية...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Folder className="w-12 h-12 text-gray-200 dark:text-gray-700" />
              <span className="text-gray-500 text-sm mt-3 font-bold">لا توجد سجلات مالية مضافة في هذا المجلد</span>
            </div>
          ) : (
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold">
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.length === items.length && items.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRowIds(items.map(item => item.id))
                        } else {
                          setSelectedRowIds([])
                        }
                      }}
                      className="rounded text-farm-blue"
                    />
                  </th>
                  {columns.map((col) => (
                    <th key={col.key} className="p-4 font-sans font-semibold text-gray-600 dark:text-gray-300">
                      {col.label}
                    </th>
                  ))}
                  <th className="p-4 w-28 text-center text-gray-600 dark:text-gray-300">المرفقات</th>
                  <th className="p-4 w-24 text-center text-gray-600 dark:text-gray-300">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item)
                      setIsRowDrawerOpen(true)
                    }}
                    className="border-b border-gray-50 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                  >
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRowIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRowIds([...selectedRowIds, item.id])
                          } else {
                            setSelectedRowIds(selectedRowIds.filter(id => id !== item.id))
                          }
                        }}
                        className="rounded text-farm-blue"
                      />
                    </td>

                    {columns.map((col) => {
                      const val = item.data?.[col.key]
                      return (
                        <td key={col.key} className="p-4 font-medium dark:text-gray-200">
                          {col.type === 'number' && typeof val === 'number'
                            ? val.toLocaleString('ar-EG')
                            : val ?? '-'}
                        </td>
                      )
                    })}

                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1 text-gray-400">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="font-bold">{item.attachments?.length ?? 0}</span>
                      </div>
                    </td>

                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenItemForm(item)}
                          className="p-1 text-gray-400 hover:text-farm-blue rounded-lg"
                        >
                          تعديل
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded-lg"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Row details Drawer & Streaming attachments */}
      {isRowDrawerOpen && selectedItem && (
        <div className="fixed inset-y-0 left-0 w-full sm:w-[500px] bg-[#ffffff] dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-2xl p-6 z-50 flex flex-col justify-between overflow-y-auto animate-slide-in">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-farm-blue" />
                <h3 className="text-base font-bold text-gray-800 dark:text-[#ffffff] font-sans">تفاصيل السجل والمستند</h3>
              </div>
              <button
                onClick={() => {
                  setIsRowDrawerOpen(false)
                  setStreamingAttachmentUrl(null)
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic details */}
            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl space-y-3">
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-semibold">{col.label}</span>
                  <span className="font-bold text-gray-700 dark:text-[#ffffff]">{selectedItem.data?.[col.key] ?? '-'}</span>
                </div>
              ))}
            </div>

            {/* Attachments Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-800 dark:text-[#ffffff] font-sans">مرفقات المستند ({selectedItem.attachments?.length ?? 0})</h4>
              
              <div className="space-y-2">
                {selectedItem.attachments?.map((attach: any) => (
                  <div key={attach.id} className="flex items-center justify-between p-3 bg-[#ffffff] dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-700 dark:text-[#ffffff] line-clamp-1">{attach.original_name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'
                          setStreamingAttachmentUrl(`${base}/archive/attachments/${attach.id}/stream`)
                        }}
                        className="text-farm-blue font-bold flex items-center gap-0.5 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>استعراض</span>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteAttachment(attach.id)}
                        className="text-red-500 font-bold"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Form */}
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 p-4 rounded-xl flex flex-col items-center gap-3 bg-gray-50/20 dark:bg-gray-900/50">
                <input
                  type="file"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                  className="text-xs text-gray-500 w-full"
                />
                <button
                  onClick={handleUploadAttachment}
                  disabled={uploadingAttachment || !attachmentFile}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-farm-blue text-[#ffffff] font-bold text-xs rounded-lg disabled:opacity-50"
                >
                  {uploadingAttachment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                  <span>رفع المرفق</span>
                </button>
              </div>
            </div>

            {/* Streaming preview panel */}
            {streamingAttachmentUrl && (
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mt-6 shadow-sm">
                <div className="bg-gray-50 dark:bg-gray-850 px-3 py-2 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center text-[10px]">
                  <span className="font-bold text-gray-600 dark:text-gray-300">معاينة المستند المباشر</span>
                  <button onClick={() => setStreamingAttachmentUrl(null)} className="text-red-500 font-bold">إغلاق</button>
                </div>
                <iframe
                  src={streamingAttachmentUrl}
                  className="w-full h-80 border-0 bg-white"
                  title="Attachment preview"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#ffffff] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-[#ffffff] font-sans">
              {editingItem ? 'تعديل السجل المالي' : 'إضافة سجل مالي جديد'}
            </h2>

            <form onSubmit={handleSaveItem} className="mt-4 space-y-4">
              {itemFormError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{itemFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {columns.map((col) => (
                  <div key={col.key}>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      {col.label} {col.required && <span className="text-red-500">*</span>}
                    </label>

                    {col.type === 'number' ? (
                      <input
                        type="number"
                        step="any"
                        value={itemFormValues[col.key] ?? ''}
                        onChange={(e) => setItemFormValues({ ...itemFormValues, [col.key]: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-farm-blue dark:text-[#ffffff]"
                      />
                    ) : col.type === 'date' ? (
                      <input
                        type="date"
                        value={itemFormValues[col.key] ?? ''}
                        onChange={(e) => setItemFormValues({ ...itemFormValues, [col.key]: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-farm-blue dark:text-[#ffffff]"
                      />
                    ) : col.type === 'select' ? (
                      <select
                        value={itemFormValues[col.key] ?? ''}
                        onChange={(e) => setItemFormValues({ ...itemFormValues, [col.key]: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-farm-blue dark:text-[#ffffff]"
                      >
                        <option value="">اختر خيار...</option>
                        {col.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={itemFormValues[col.key] ?? ''}
                        onChange={(e) => setItemFormValues({ ...itemFormValues, [col.key]: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-farm-blue dark:text-[#ffffff]"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-farm-blue text-[#ffffff] font-bold text-xs rounded-lg hover:bg-opacity-90 active:scale-[0.98]"
                >
                  {(createItemMutation.isPending || updateItemMutation.isPending) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>حفظ البيانات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Config Add Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#ffffff] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-[#ffffff] font-sans">إضافة بطاقة تحليلات جديدة</h2>

            <form onSubmit={handleCreateStatsConfig} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">عنوان البطاقة</label>
                <input
                  type="text"
                  required
                  value={statsName}
                  onChange={(e) => setStatsName(e.target.value)}
                  placeholder="مثال: إجمالي المصروفات"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none dark:text-[#ffffff]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">نوع التجميع (Aggregation)</label>
                <select
                  value={statsAgg}
                  onChange={(e) => setStatsAgg(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-[#ffffff]"
                >
                  <option value="count">عدد السجلات (Count)</option>
                  <option value="sum_total">مجموع القيم (Sum)</option>
                  <option value="avg">متوسط القيم (Average)</option>
                </select>
              </div>

              {statsAgg !== 'count' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">الحقل المستهدف للعملية</label>
                  <select
                    value={statsCol}
                    required
                    onChange={(e) => setStatsCol(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-[#ffffff]"
                  >
                    <option value="">اختر حقل البيانات المالي...</option>
                    {columns.filter(c => c.type === 'number').map(col => (
                      <option key={col.key} value={col.key}>{col.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowStatsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-farm-blue text-[#ffffff] font-bold text-xs rounded-lg hover:bg-opacity-90"
                >
                  إضافة الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Imports Fuzzy Matching Confirmation Dialog */}
      {showExcelModal && excelFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#ffffff] dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-[#ffffff] font-sans flex items-center gap-1.5 text-emerald-600">
                <FileSpreadsheet className="w-5 h-5" />
                <span>مطابقة وتأكيد ترويسات الاستيراد الذكي</span>
              </h2>
              <button onClick={() => setShowExcelModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-4">
              لقد قمنا بقراءة الأعمدة في ملف الإكسل ومطابقتها تقريبياً مع حقول النموذج. يرجى التحقق من صحة المطابقات وتعديل الخيارات الخاطئة قبل المتابعة.
            </p>

            <div className="mt-4 space-y-4">
              {excelHeaders.map((hdr) => (
                <div key={hdr} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs">
                  <div>
                    <span className="block text-[10px] text-gray-400 font-semibold">ترويسة ملف Excel</span>
                    <span className="font-bold text-gray-700 dark:text-[#ffffff]">{hdr}</span>
                  </div>

                  <div className="w-full sm:w-56">
                    <span className="block text-[10px] text-gray-400 font-semibold mb-1">المطابقة مع الحقل المستهدف</span>
                    <select
                      value={fuzzyMappings[hdr] ?? ''}
                      onChange={(e) => setFuzzyMappings({ ...fuzzyMappings, [hdr]: e.target.value })}
                      className="w-full p-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-xs"
                    >
                      <option value="">تخطي هذا العمود (عدم الاستيراد)</option>
                      {columns.map(c => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150 mt-6">
              <button
                type="button"
                onClick={() => setShowExcelModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmExcelImport}
                disabled={excelImportLoading}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-[#ffffff] font-bold text-xs rounded-lg hover:bg-opacity-95 disabled:opacity-50"
              >
                {excelImportLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>استيراد وحفظ السجلات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
