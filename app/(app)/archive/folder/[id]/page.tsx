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
  EyeOff,
  Link2,
  ArrowDownToLine,
  Activity,
  CheckCircle,
  HelpCircle,
  Edit3,
  Sliders,
  TrendingUp,
  Calendar,
  Printer
} from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'

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
  const visibleColumns = columns.filter(col => col.is_shown !== false)

  // Dynamic Row Drawer
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isRowDrawerOpen, setIsRowDrawerOpen] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [streamingAttachmentUrl, setStreamingAttachmentUrl] = useState<string | null>(null)
  const [loadingAttachmentId, setLoadingAttachmentId] = useState<number | null>(null)
  const [exportingRecords, setExportingRecords] = useState(false)

  // Item Form Modal
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [itemFormValues, setItemFormValues] = useState<Record<string, any>>({})
  const [itemFormError, setItemFormError] = useState('')

  // Client-side real-time formula evaluator
  useEffect(() => {
    let hasChanges = false
    const computedValues = { ...itemFormValues }

    columns.forEach(col => {
      if (col.formula) {
        const formula = col.formula
        const matches = formula.match(/\[([a-zA-Z0-9_]+)\]/g) || []
        let expr = formula

        matches.forEach((placeholder: string) => {
          const colKey = placeholder.slice(1, -1)
          const val = parseFloat(computedValues[colKey]) || 0
          expr = expr.replaceAll(placeholder, String(val))
        })

        // Strict whitelist: digits, standard operators, parentheses, dot, spaces
        const cleanExpr = expr.replace(/[^0-9\+\-\*\/\(\)\.\s]/g, '')

        let result = 0
        if (cleanExpr.trim()) {
          try {
            result = new Function(`return ${cleanExpr}`)()
            if (isNaN(result) || !isFinite(result)) {
              result = 0
            }
          } catch (e) {
            result = 0
          }
        }

        if (computedValues[col.key] !== result) {
          computedValues[col.key] = result
          hasChanges = true
        }
      }
    })

    if (hasChanges) {
      setItemFormValues(computedValues)
    }
  }, [itemFormValues, columns])

  // Multi-Select Bulk state
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([])

  // Dynamic KPI Stats configs
  const { data: statsConfigsRes, refetch: refetchStatsConfigs } = useFolderStatsConfigs(folderId)
  const createStatsMutation = useCreateStatsConfig(folderId)
  
  // Date range selectors
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedDateCol, setSelectedDateCol] = useState('')

  // Stats Config Add/Edit Modal States
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [editingStatsId, setEditingStatsId] = useState<number | null>(null)
  
  const [statsName, setStatsName] = useState('')
  const [statsChartType, setStatsChartType] = useState<'card' | 'bar' | 'pie' | 'line' | 'table'>('card')
  const [statsAgg, setStatsAgg] = useState<'count' | 'distinct_count' | 'sum_total' | 'sum_group' | 'avg'>('count')
  const [statsCol, setStatsCol] = useState('')
  const [statsGroupBy, setStatsGroupBy] = useState('')
  
  const [statsThresholdVal, setStatsThresholdVal] = useState('')
  const [statsThresholdCond, setStatsThresholdCond] = useState('')
  const [statsThresholdAlert, setStatsThresholdAlert] = useState<'positive' | 'negative'>('negative')
  const [statsColor, setStatsColor] = useState('#3b82f6')

  // Auto-detect date column
  useEffect(() => {
    if (columns.length > 0 && !selectedDateCol) {
      const dateCol = columns.find(c => c.type === 'date')
      if (dateCol) {
        setSelectedDateCol(dateCol.key)
      }
    }
  }, [columns, selectedDateCol])

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
      {
        key: `col_${Date.now()}`,
        label: 'حقل جديد',
        label_ar: 'حقل جديد',
        label_en: 'New Field',
        type: 'text',
        required: false,
        searchable: true,
        is_group_by: false,
        is_sum: false,
        is_shown: true,
        is_attachment_key: false,
        validation: 'none',
        validation_pattern: '',
        validation_min: '',
        validation_max: '',
        formula: ''
      }
    ])
  }

  const handleRemoveColumn = (index: number) => {
    setSchemaColumns(schemaColumns.filter((_, idx) => idx !== index))
  }

  const handleUpdateColumnField = (index: number, field: string, value: any) => {
    let updated = [...schemaColumns]
    if (field === 'is_attachment_key' && value === true) {
      updated = updated.map((col, idx) => ({
        ...col,
        is_attachment_key: idx === index
      }))
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    if (field === 'label_ar') {
      updated[index].label = value
    }
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

  const handleExportDownload = async () => {
    setExportingRecords(true)

    try {
      await archiveApi.downloadExport(folderId)
    } catch (err: any) {
      alert('فشل تنزيل ملف التصدير: ' + (err?.message ?? ''))
    } finally {
      setExportingRecords(false)
    }
  }

  const handleOpenAttachmentPreview = async (attachId: number) => {
    setLoadingAttachmentId(attachId)

    try {
      const res = await archiveApi.getAttachmentDownloadUrl(attachId)
      setStreamingAttachmentUrl(res.data.url)
    } catch (err: any) {
      alert('تعذر تحميل رابط المعاينة الآمن: ' + (err?.message ?? ''))
    } finally {
      setLoadingAttachmentId(null)
    }
  }

  // Add or Update Stats Config
  const handleCreateOrUpdateStatsConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!statsName.trim()) return

    const payload = {
      name: statsName.trim(),
      chart_type: statsChartType,
      aggregation: statsAgg,
      column_key: statsCol || undefined,
      group_by_key: statsGroupBy || undefined,
      threshold_value: statsThresholdVal ? parseFloat(statsThresholdVal) : null,
      threshold_condition: statsThresholdCond || null,
      threshold_alert_type: statsThresholdAlert,
      widget_color: statsColor || null,
    } as any

    try {
      if (editingStatsId) {
        await archiveApi.updateStatsConfig(folderId, editingStatsId, payload)
        alert('تم تعديل البطاقة بنجاح!')
      } else {
        await createStatsMutation.mutateAsync(payload)
      }
      setShowStatsModal(false)
      setEditingStatsId(null)
      refetchStatsConfigs()
    } catch (err: any) {
      alert('فشل حفظ إعدادات البطاقة: ' + err?.message)
    }
  }

  // Delete Stats Config
  const handleDeleteStatsConfig = async (configId: number) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف بطاقة التحليلات هذه؟')) return
    try {
      await archiveApi.deleteStatsConfig(folderId, configId)
      refetchStatsConfigs()
    } catch (err: any) {
      alert('حدث خطأ أثناء الحذف: ' + err?.message)
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

  // --- Premium SVG Dashboard Chart Components ---
  const SVGBarChart = ({ labels, values, color = '#3b82f6' }: { labels: string[], values: number[], color?: string }) => {
    const max = Math.max(...values, 1)
    return (
      <div className="w-full flex flex-col justify-end space-y-2 mt-2 font-sans">
        <div className="flex items-end justify-between h-28 px-1 gap-1.5">
          {values.map((v, idx) => {
            const heightPercent = Math.max((v / max) * 100, 5)
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-30">
                  <div className="bg-surface-inverse text-ink-inverse text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    {labels[idx]}: {v.toLocaleString('ar-EG', { maximumFractionDigits: 1 })}
                  </div>
                  <div className="w-1.5 h-1.5 bg-surface-inverse rotate-45 -mt-1"></div>
                </div>
                
                {/* SVG Bar */}
                <div 
                  style={{ height: `${heightPercent}%`, backgroundColor: color }}
                  className="w-full rounded-t-sm hover:opacity-80 transition-colors duration-300 shadow-sm"
                />
              </div>
            )
          })}
        </div>
        
        {/* X Axis Labels */}
        <div className="flex justify-between border-t border-line pt-1 text-xs text-ink-muted font-semibold px-0.5">
          {labels.map((lbl, idx) => (
            <span key={idx} className="truncate max-w-[40px] text-center" title={lbl}>{lbl}</span>
          ))}
        </div>
      </div>
    )
  }

  const SVGPieChart = ({ labels, values }: { labels: string[], values: number[] }) => {
    const total = values.reduce((a, b) => a + b, 0)
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']
    
    let accumulatedAngle = 0
    
    return (
      <div className="flex items-center justify-between gap-2 mt-2 font-sans">
        {/* SVG Donut */}
        <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(229,231,235,0.15)" strokeWidth="3.5" />
            
            {values.map((v, idx) => {
              const percentage = total > 0 ? (v / total) * 100 : 0
              const strokeDash = `${percentage} ${100 - percentage}`
              const strokeOffset = 100 - accumulatedAngle + 25
              accumulatedAngle += percentage
              
              return (
                <circle
                  key={idx}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={colors[idx % colors.length]}
                  strokeWidth="3.8"
                  strokeDasharray={strokeDash}
                  strokeDashoffset={strokeOffset}
                  className="transition-colors duration-500 ease-out hover:stroke-[4.5] cursor-pointer"
                />
              )
            })}
          </svg>
          <div className="absolute flex flex-col items-center text-center">
            <span className="text-xs text-ink-muted font-bold">الإجمالي</span>
            <span className="text-xs font-bold text-ink truncate max-w-[60px]">
              {total.toLocaleString('ar-EG', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
        
        {/* Legends */}
        <div className="flex-1 space-y-0.5 max-h-24 overflow-y-auto pr-0.5">
          {labels.slice(0, 4).map((lbl, idx) => (
            <div key={idx} className="flex items-center gap-1 text-xs">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
              <span className="text-ink-muted truncate max-w-[65px]" title={lbl}>{lbl}</span>
              <span className="text-ink-soft font-semibold mr-auto">
                {total > 0 ? Math.round((values[idx] / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const SVGLineChart = ({ labels, values, color = '#8b5cf6' }: { labels: string[], values: number[], color?: string }) => {
    const max = Math.max(...values, 1)
    const min = Math.min(...values, 0)
    const range = max - min
    
    const width = 300
    const height = 110
    const padding = 10
    
    const points = values.map((v, idx) => {
      const x = padding + (idx / Math.max(values.length - 1, 1)) * (width - padding * 2)
      const y = height - padding - ((v - min) / range) * (height - padding * 2)
      return { x, y, value: v, label: labels[idx] }
    })
    
    // Bezier curve calculations
    let dPath = ''
    if (points.length > 0) {
      dPath = `M ${points[0].x} ${points[0].y}`
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i]
        const p1 = points[i + 1]
        const cpX1 = p0.x + (p1.x - p0.x) / 3
        const cpY1 = p0.y
        const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3
        const cpY2 = p1.y
        dPath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`
      }
    }
    
    // Area gradient path
    const dAreaPath = points.length > 0 
      ? `${dPath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : ''

    return (
      <div className="w-full mt-2 font-sans">
        <div className="relative w-full h-[110px]">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
            <defs>
              <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            
            {/* Gradient Area */}
            {dAreaPath && <path d={dAreaPath} fill={`url(#grad-${color.replace('#', '')})`} />}
            
            {/* Bezier Path */}
            {dPath && <path d={dPath} fill="transparent" stroke={color} strokeWidth="2.2" strokeLinecap="round" />}
            
            {/* Interactive Points */}
            {points.map((p, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="2.5" fill="#ffffff" stroke={color} strokeWidth="1.2" />
                <circle cx={p.x} cy={p.y} r="6" fill="transparent" className="hover:fill-current hover:text-black/5" />
                
                {/* Custom hover tooltip */}
                <foreignObject x={p.x - 35} y={p.y - 25} width="70" height="20" className="hidden group-hover:block overflow-visible z-30">
                  <div className="bg-surface-inverse text-ink-inverse text-xs font-bold py-0.5 px-1 rounded shadow text-center whitespace-nowrap truncate">
                    {p.label}: {p.value.toLocaleString('ar-EG', { maximumFractionDigits: 1 })}
                  </div>
                </foreignObject>
              </g>
            ))}
          </svg>
        </div>
        
        {/* X Axis Labels */}
        <div className="flex justify-between border-t border-line pt-1 text-xs text-ink-muted font-semibold px-0.5 mt-0.5">
          {labels.map((lbl, idx) => (
            <span key={idx} className="truncate max-w-[40px] text-center" title={lbl}>{lbl}</span>
          ))}
        </div>
      </div>
    )
  }

  const SVGTableList = ({ labels, values, color = '#10b981' }: { labels: string[], values: number[], color?: string }) => {
    const max = Math.max(...values, 1)
    return (
      <div className="w-full mt-2 space-y-1.5 max-h-32 overflow-y-auto font-sans pr-0.5">
        {labels.map((lbl, idx) => {
          const val = values[idx]
          const percent = (val / max) * 100
          return (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-ink-soft truncate max-w-[120px]">{lbl}</span>
                <span className="text-ink">{val.toLocaleString('ar-EG')}</span>
              </div>
              <div className="w-full bg-surface-muted h-1 rounded-full overflow-hidden">
                <div style={{ width: `${percent}%`, backgroundColor: color }} className="h-full rounded-full transition-colors duration-500 ease-out" />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Upgraded Stats Card Component for dynamic, styled layouts
  const StatsCard = ({ config }: { config: any }) => {
    const { data: resultRes, isLoading } = useStatsResult(folderId, config.id, {
      from: dateFrom || undefined,
      to: dateTo || undefined,
      column: selectedDateCol || undefined
    })

    if (isLoading) {
      return (
        <div className="h-40 bg-surface border border-line rounded-2xl flex items-center justify-center">
          <Loader2 className="w-5.5 h-5.5 animate-spin text-action-primary" />
        </div>
      )
    }

    const resultsData = resultRes?.results as any
    const val = resultsData?.value ?? 0
    const isGrouped = resultsData?.type === 'grouped'
    const labels = resultsData?.labels ?? []
    const values = resultsData?.values ?? []

    // Alert calculation
    let isAlertActive = false
    if (!isGrouped && typeof val === 'number' && config.threshold_value !== undefined && config.threshold_value !== null && config.threshold_condition) {
      const thVal = config.threshold_value
      const cond = config.threshold_condition
      if (cond === 'gt' && val > thVal) isAlertActive = true
      if (cond === 'lt' && val < thVal) isAlertActive = true
      if (cond === 'eq' && val === thVal) isAlertActive = true
    }

    const isPositive = config.threshold_alert_type === 'positive'
    const customColor = config.widget_color || '#3b82f6'

    // Card styling based on alert status
    let cardClasses = "bg-surface border border-line rounded-2xl shadow-sm p-5 relative overflow-hidden transition-colors duration-300 hover:shadow-md"
    if (isAlertActive) {
      if (isPositive) {
        cardClasses += " border-success bg-success-soft/5 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
      } else {
        cardClasses += " border-danger bg-danger-soft/5 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
      }
    }

    const handleEditWidget = () => {
      setEditingStatsId(config.id)
      setStatsName(config.name)
      setStatsChartType(config.chart_type)
      setStatsAgg(config.aggregation)
      setStatsCol(config.column_key || '')
      setStatsGroupBy(config.group_by_key || '')
      setStatsThresholdVal(config.threshold_value?.toString() || '')
      setStatsThresholdCond(config.threshold_condition || '')
      setStatsThresholdAlert(config.threshold_alert_type || 'negative')
      setStatsColor(config.widget_color || '#3b82f6')
      setShowStatsModal(true)
    }

    return (
      <div className={cardClasses}>
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs text-ink-muted font-bold truncate max-w-[130px]" title={config.name}>
              {config.name}
            </span>
            {isAlertActive && (
              <span className={`flex h-2 w-2 rounded-full relative ${isPositive ? 'bg-success' : 'bg-danger'}`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPositive ? 'bg-success' : 'bg-danger'}`}></span>
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 opacity-0 hover:opacity-100 focus-within:opacity-100 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleEditWidget}
              title="تعديل"
              className="p-1 hover:bg-surface-muted rounded text-ink-muted hover:text-ink-soft transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => handleDeleteStatsConfig(config.id)}
              title="حذف"
              className="p-1 hover:bg-danger-soft rounded text-ink-muted hover:text-danger transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card render */}
        {config.chart_type === 'card' && (
          <div className="flex items-center justify-between mt-1">
            <div className="min-w-0">
              <h4 className="text-xl font-bold text-ink font-sans truncate">
                {typeof val === 'number' ? val.toLocaleString('ar-EG', { maximumFractionDigits: 1 }) : val}
              </h4>
              {config.threshold_value !== undefined && config.threshold_value !== null && (
                <div className="flex items-center gap-1 text-xs text-ink-muted mt-1 font-sans">
                  <span>الحد:</span>
                  <span className="font-bold">{config.threshold_condition === 'gt' ? '>' : config.threshold_condition === 'lt' ? '<' : '='} {config.threshold_value.toLocaleString('ar-EG')}</span>
                </div>
              )}
            </div>
            
            <div className="p-2.5 rounded-xl flex-shrink-0" style={{ backgroundColor: `${customColor}15`, color: customColor }}>
              <Activity className="w-4.5 h-4.5" />
            </div>
          </div>
        )}

        {isGrouped && config.chart_type === 'bar' && (
          <SVGBarChart labels={labels} values={values} color={customColor} />
        )}

        {isGrouped && config.chart_type === 'pie' && (
          <SVGPieChart labels={labels} values={values} />
        )}

        {isGrouped && config.chart_type === 'line' && (
          <SVGLineChart labels={labels} values={values} color={customColor} />
        )}

        {isGrouped && config.chart_type === 'table' && (
          <SVGTableList labels={labels} values={values} color={customColor} />
        )}

        {isGrouped && config.chart_type === 'card' && (
          <div className="text-xs text-warning font-semibold mt-1 font-sans">
            البطاقة لا تدعم بيانات المجموعات، يرجى التعديل لاختيار نوع رسم بياني آخر.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Breadcrumb Header */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        <Link href="/archive" className="hover:text-action-primary font-semibold">الأرشيف الرئيسي</Link>
        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/archive" className="hover:text-action-primary font-semibold">
              <span>{crumb.name}</span>
            </Link>
          </React.Fragment>
        ))}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-bold text-action-primary">{folderRes?.data?.name ?? 'المجلد الحالي'}</span>
      </div>

      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-2xl border border-line shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-success-soft text-success rounded-2xl shadow-sm">
            <Folder className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink font-sans">
              {folderRes?.data?.name ?? 'سجلات المجلد المالي'}
            </h1>
            <p className="text-xs text-ink-muted mt-1">تخصيص الحقول، استيراد جداول البيانات، والمعالجة بالذكاء الاصطناعي</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Custom Schema Settings */}
          <button
            onClick={() => setIsEditingSchema(!isEditingSchema)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border font-semibold text-xs transition-colors active:scale-[0.98] ${
              isEditingSchema
                ? 'bg-warning-soft text-warning border-warning-soft'
                : 'bg-surface text-ink-soft border-line hover:bg-surface-muted'
            }`}
          >
            <Settings className="w-4 h-4 animate-spin-slow" />
            <span>{isEditingSchema ? 'إلغاء ضبط الحقول' : 'ضبط حقول البيانات'}</span>
          </button>

          {/* Add item */}
          <button
            onClick={() => handleOpenItemForm()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-action-primary text-ink-inverse font-bold text-xs rounded-xl shadow-md hover:bg-opacity-90 active:scale-[0.98] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سجل مالي</span>
          </button>
        </div>
      </div>

      {/* Analytics Dashboard Header & Dynamic Date Filter Bar */}
      <div className="bg-surface border border-line p-6 rounded-2xl shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-2 text-action-primary">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-sm font-bold font-sans">لوحة المؤشرات الإحصائية والتحليلات البيانية الذكية</h3>
          </div>
          
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 border border-line rounded-xl text-xs font-bold text-ink-soft hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>تصدير كتقرير / طباعة</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-line">
          {/* Quick Date Range Selection */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const now = new Date()
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
                setDateFrom(firstDay)
                setDateTo(lastDay)
              }}
              className="px-3 py-1.5 bg-surface-muted hover:bg-surface-muted rounded-lg text-xs font-bold text-ink-muted transition-colors"
            >
              هذا الشهر
            </button>
            <button
              onClick={() => {
                const now = new Date()
                const firstDay = `${now.getFullYear()}-01-01`
                const lastDay = `${now.getFullYear()}-12-31`
                setDateFrom(firstDay)
                setDateTo(lastDay)
              }}
              className="px-3 py-1.5 bg-surface-muted hover:bg-surface-muted rounded-lg text-xs font-bold text-ink-muted transition-colors"
            >
              هذه السنة
            </button>
            <button
              onClick={() => {
                setDateFrom('')
                setDateTo('')
              }}
              className="px-3 py-1.5 bg-surface-muted hover:bg-surface-muted rounded-lg text-xs font-bold text-ink-muted transition-colors"
            >
              كل الأوقات
            </button>
          </div>

          {/* Date Picker Inputs */}
          <div className="flex flex-wrap items-center gap-3 mr-auto min-w-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-ink-muted flex-shrink-0">الفلترة بـ:</span>
              <select
                value={selectedDateCol}
                onChange={(e) => setSelectedDateCol(e.target.value)}
                className="px-3 py-1.5 bg-surface-muted border border-line rounded-xl text-xs focus:outline-none"
              >
                {columns.filter(c => c.type === 'date').map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
                {columns.filter(c => c.type === 'date').length === 0 && (
                  <option value="">لا يوجد عمود تاريخ</option>
                )}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 bg-surface-muted border border-line rounded-xl text-xs focus:outline-none"
              />
              <span className="text-ink-muted">إلى</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 bg-surface-muted border border-line rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>
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
          className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-line hover:border-action-primary rounded-2xl text-ink-muted hover:text-action-primary transition-colors group"
        >
          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold font-sans">إضافة بطاقة إحصائيات</span>
        </button>
      </div>

      {/* Excel & OCR Pipeline Actions Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Excel Pipeline Panel */}
        <div className="p-6 bg-surface border border-line rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-success">
            <FileSpreadsheet className="w-5 h-5" />
            <h3 className="text-sm font-bold font-sans">معالجة واستيراد جداول البيانات الذكية (Excel)</h3>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            ارفع ملف إكسل مباشرة. سيقوم النظام بتحليل الترويسات ومطابقتها ذكياً مع حقول هذا المجلد المالي باستخدام التوافق التقريبي للحروف والترجمات.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-surface-muted hover:bg-surface-muted border border-line rounded-xl text-xs font-bold text-ink-soft cursor-pointer transition-colors">
              <span>اختر ملف Excel</span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} className="hidden" />
            </label>
            
            <button
              type="button"
              onClick={handleExportDownload}
              disabled={exportingRecords}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-line rounded-xl text-xs font-bold text-ink-soft hover:bg-surface-muted transition-colors"
            >
              {exportingRecords ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowDownToLine className="w-3.5 h-3.5" />
              )}
              <span>{exportingRecords ? 'جاري تجهيز الملف...' : 'تصدير السجلات الحالية'}</span>
            </button>
          </div>
        </div>

        {/* OCR Scanner Pipeline Panel */}
        <div className="p-6 bg-surface border border-line rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-action-secondary">
            <ScanFace className="w-5 h-5" />
            <h3 className="text-sm font-bold font-sans">المعالجة بالذكاء الاصطناعي والاستخراج الضوئي (OCR)</h3>
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            قم برفع حزمة من المستندات الممسوحة ضوئياً (PDF/صور). سيقوم محرك القراءة في الخلفية بالاستخراج الذكي للقيم وتطابقها لحفظ السجلات تلقائياً.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
            <input
              type="file"
              multiple
              accept="application/pdf,image/*"
              onChange={(e) => setScanFiles(e.target.files)}
              className="text-xs text-ink-muted border border-line p-1.5 rounded-lg w-full max-w-xs"
            />
            <button
              onClick={handleScannerUpload}
              disabled={scanningLoading || !scanFiles}
              className="px-4 py-2 bg-action-secondary hover:bg-action-secondary-hover text-ink-inverse font-bold text-xs rounded-xl shadow disabled:opacity-50 transition-colors"
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
            <div className="flex items-center justify-between rounded-xl border border-line bg-surface-subtle p-3 text-xs">
              <span className="text-action-secondary font-semibold animate-pulse">
                حالة الاستخراج: {jobStatus === 'pending' ? 'انتظار' : 'جاري الفحص المتقدم للمحتوى'}
              </span>
              <Loader2 className="w-4 h-4 text-action-secondary animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Schema Columns Builder Editor Panel */}
      {isEditingSchema && (
        <div className="p-6 bg-warning-soft border border-warning-soft rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink font-sans">تعديل هيكل حقول البيانات والمستندات</h3>
            <button
              onClick={handleAddColumn}
              className="flex items-center gap-1 px-3 py-1.5 bg-warning text-ink-inverse text-xs font-bold rounded-lg hover:bg-opacity-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حقل جديد</span>
            </button>
          </div>

          <div className="space-y-3">
            {schemaColumns.map((col, index) => (
              <div key={col.key || index} className="space-y-3.5 p-4 bg-surface border border-line rounded-2xl text-xs shadow-sm">
                
                {/* Row 1: Key Metadata Fields */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-full sm:w-48">
                    <label className="block text-xs text-ink-muted font-semibold mb-1">اسم الحقل بالعربية</label>
                    <input
                      type="text"
                      value={col.label_ar || col.label || ''}
                      onChange={(e) => {
                        handleUpdateColumnField(index, 'label_ar', e.target.value)
                        handleUpdateColumnField(index, 'label', e.target.value)
                      }}
                      placeholder="مثال: قيمة المبيعات"
                      className="w-full p-2 border border-line bg-surface-muted rounded-xl focus:outline-none focus:ring-1 focus:ring-warning"
                    />
                  </div>

                  <div className="w-full sm:w-48">
                    <label className="block text-xs text-ink-muted font-semibold mb-1">اسم الحقل بالإنجليزية</label>
                    <input
                      type="text"
                      value={col.label_en || ''}
                      onChange={(e) => handleUpdateColumnField(index, 'label_en', e.target.value)}
                      placeholder="Example: Sales Amount"
                      className="w-full p-2 border border-line bg-surface-muted rounded-xl focus:outline-none focus:ring-1 focus:ring-warning"
                    />
                  </div>

                  <div className="w-full sm:w-40">
                    <label className="block text-xs text-ink-muted font-semibold mb-1">المعرف البرمجي (لاتيني)</label>
                    <input
                      type="text"
                      value={col.key}
                      onChange={(e) => handleUpdateColumnField(index, 'key', e.target.value)}
                      placeholder="example_key"
                      className="w-full p-2 border border-line bg-surface-muted rounded-xl focus:outline-none focus:ring-1 focus:ring-warning"
                    />
                  </div>

                  <div className="w-full sm:w-36">
                    <label className="block text-xs text-ink-muted font-semibold mb-1">نوع البيانات</label>
                    <select
                      value={col.type}
                      onChange={(e) => handleUpdateColumnField(index, 'type', e.target.value)}
                      className="w-full p-2 border border-line bg-surface-muted rounded-xl focus:outline-none focus:ring-1 focus:ring-warning"
                    >
                      <option value="text">نص (Text)</option>
                      <option value="number">رقم (Number)</option>
                      <option value="date">تاريخ (Date)</option>
                      <option value="select">قائمة خيارات (Select)</option>
                      <option value="boolean">منطقي (صح/خطأ)</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Select options or Formulas or Validations */}
                <div className="flex flex-wrap items-center gap-3">
                  {col.type === 'select' && (
                    <div className="w-full sm:w-64">
                      <label className="block text-xs text-ink-muted font-semibold mb-1">الخيارات المتاحة (مفصولة بفاصلة)</label>
                      <input
                        type="text"
                        placeholder="خيار1, خيار2, خيار3"
                        value={Array.isArray(col.options) ? col.options.join(',') : ''}
                        onChange={(e) => handleUpdateColumnField(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        className="w-full p-2 border border-line bg-surface-muted rounded-xl focus:outline-none focus:ring-1 focus:ring-warning"
                      />
                    </div>
                  )}

                  {col.type === 'number' && (
                    <div className="w-full sm:w-64">
                      <label className="block text-xs text-ink-muted font-semibold mb-1">معادلة حسابية (اختياري، مثل: [qty] * [price])</label>
                      <input
                        type="text"
                        placeholder="[qty] * [price]"
                        value={col.formula || ''}
                        onChange={(e) => handleUpdateColumnField(index, 'formula', e.target.value)}
                        className="w-full p-2 border border-line bg-surface-muted rounded-xl focus:outline-none focus:ring-1 focus:ring-warning text-left ltr"
                      />
                    </div>
                  )}

                  {col.type !== 'boolean' && col.type !== 'select' && !col.formula && (
                    <>
                      <div className="w-full sm:w-40">
                        <label className="block text-xs text-ink-muted font-semibold mb-1">قاعدة التحقق من المدخلات</label>
                        <select
                          value={col.validation || 'none'}
                          onChange={(e) => handleUpdateColumnField(index, 'validation', e.target.value)}
                          className="w-full p-2 border border-line bg-surface-muted rounded-xl focus:outline-none focus:ring-1 focus:ring-warning"
                        >
                          <option value="none">بدون قيود</option>
                          <option value="email">بريد إلكتروني (Email)</option>
                          <option value="phone">رقم هاتف (Phone)</option>
                          <option value="regex">تعبير منتظم مخصص (RegEx)</option>
                        </select>
                      </div>

                      {col.validation === 'regex' && (
                        <div className="w-full sm:w-48">
                          <label className="block text-xs text-ink-muted font-semibold mb-1">تنسيق التعبير المنتظم (Pattern)</label>
                          <input
                            type="text"
                            placeholder="^[A-Z]{3}-\d+$"
                            value={col.validation_pattern || ''}
                            onChange={(e) => handleUpdateColumnField(index, 'validation_pattern', e.target.value)}
                            className="w-full p-2 border border-line bg-surface-muted rounded-xl focus:outline-none focus:ring-1 focus:ring-warning text-left ltr"
                          />
                        </div>
                      )}

                      <div className="w-full sm:w-28">
                        <label className="block text-xs text-ink-muted font-semibold mb-1">
                          {col.type === 'number' ? 'الحد الأدنى للقيمة' : 'الحد الأدنى للحروف'}
                        </label>
                        <input
                          type="number"
                          value={col.validation_min !== undefined ? col.validation_min : ''}
                          onChange={(e) => handleUpdateColumnField(index, 'validation_min', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full p-2 border border-line bg-surface-muted rounded-xl focus:outline-none focus:ring-1 focus:ring-warning"
                        />
                      </div>

                      <div className="w-full sm:w-28">
                        <label className="block text-xs text-ink-muted font-semibold mb-1">
                          {col.type === 'number' ? 'الحد الأقصى للقيمة' : 'الحد الأقصى للحروف'}
                        </label>
                        <input
                          type="number"
                          value={col.validation_max !== undefined ? col.validation_max : ''}
                          onChange={(e) => handleUpdateColumnField(index, 'validation_max', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          className="w-full p-2 border border-line bg-surface-muted rounded-xl focus:outline-none focus:ring-1 focus:ring-warning"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Row 3: Action Buttons & Configurations */}
                <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-line">
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-ink-soft">
                      <input
                        type="checkbox"
                        checked={!!col.required}
                        onChange={(e) => handleUpdateColumnField(index, 'required', e.target.checked)}
                        className="rounded border-line-strong bg-transparent text-warning focus:ring-warning focus:ring-offset-0"
                      />
                      <span>إجباري</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-ink-soft">
                      <input
                        type="checkbox"
                        checked={!!col.searchable}
                        onChange={(e) => handleUpdateColumnField(index, 'searchable', e.target.checked)}
                        className="rounded border-line-strong bg-transparent text-warning focus:ring-warning focus:ring-offset-0"
                      />
                      <span>قابل للبحث</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-ink-soft">
                      <input
                        type="checkbox"
                        checked={!!col.is_group_by}
                        onChange={(e) => handleUpdateColumnField(index, 'is_group_by', e.target.checked)}
                        className="rounded border-line-strong bg-transparent text-warning focus:ring-warning focus:ring-offset-0"
                      />
                      <span>تجميع حسب</span>
                    </label>

                    {col.type === 'number' && (
                      <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-ink-soft">
                        <input
                          type="checkbox"
                          checked={!!col.is_sum}
                          onChange={(e) => handleUpdateColumnField(index, 'is_sum', e.target.checked)}
                          className="rounded border-line-strong bg-transparent text-warning focus:ring-warning focus:ring-offset-0"
                        />
                        <span>جمع القيم</span>
                      </label>
                    )}

                    {/* Visible Toggle Purple Eye */}
                    <button
                      type="button"
                      onClick={() => handleUpdateColumnField(index, 'is_shown', col.is_shown !== false ? false : true)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors ${
                        col.is_shown !== false
                          ? 'bg-info-soft text-info border-info-soft'
                          : 'bg-surface-muted text-ink-muted border-line'
                      }`}
                      title="إظهار/إخفاء الحقل في الجدول"
                    >
                      {col.is_shown !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{col.is_shown !== false ? 'مرئي في الجدول' : 'مخفي في الجدول'}</span>
                    </button>

                    {/* Attachment Key Radio Orange Link */}
                    <button
                      type="button"
                      onClick={() => handleUpdateColumnField(index, 'is_attachment_key', !col.is_attachment_key)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors ${
                        col.is_attachment_key
                          ? 'bg-orange-100 text-orange-700 border-orange-200 font-bold shadow-sm'
                          : 'bg-surface-muted text-ink-muted border-line'
                      }`}
                      title="تحديد كـ مفتاح ربط للمرفقات المشتركة بين الصفوف"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>{col.is_attachment_key ? 'مفتاح المرفقات المشتركة' : 'ربط بالمرفقات'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveColumn(index)}
                    className="p-2 text-ink-muted hover:text-danger hover:bg-danger-soft rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-warning-soft">
            <button
              onClick={() => setIsEditingSchema(false)}
              className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-muted rounded-lg"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveSchema}
              disabled={updateSchemaMutation.isPending}
              className="flex items-center gap-1.5 px-5 py-2 bg-warning text-ink-inverse text-xs font-bold rounded-lg hover:bg-warning-strong"
            >
              {updateSchemaMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>حفظ التعديلات الحقلية</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Tabular Document Ledger View */}
      <div className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden">
        {/* Grid Filters Bar */}
        <div className="p-6 border-b border-line flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="بحث في السجلات..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="w-full pl-4 pr-10 py-2 bg-surface-muted border border-line rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-farm-blue"
            />
            <Search className="w-3.5 h-3.5 text-ink-muted absolute right-3.5 top-3" />
          </div>

          {selectedRowIds.length > 0 && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-ink-muted font-semibold">
                تم تحديد <span className="text-danger font-bold">{selectedRowIds.length}</span> من السجلات
              </span>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1 rounded-lg bg-danger-soft px-3 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger-soft"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف المحدد</span>
              </button>
            </div>
          )}
        </div>

        {/* Responsive Table Grid */}
        {loadingItems ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-action-primary animate-spin" />
            <span className="text-ink-muted text-sm mt-3 font-semibold">جاري تحميل السجلات المالية...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Folder className="w-12 h-12 text-ink-muted" />
            <span className="text-ink-muted text-sm mt-3 font-bold">لا توجد سجلات مالية مضافة في هذا المجلد</span>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-surface-subtle border-b border-line text-ink-muted font-semibold">
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
                      className="rounded text-action-primary"
                    />
                  </th>
                  {visibleColumns.map((col) => (
                    <th key={col.key} className="p-4 font-sans font-semibold text-ink-soft">
                      {col.label}
                    </th>
                  ))}
                  <th className="p-4 w-28 text-center text-ink-soft">المرفقات</th>
                  <th className="p-4 w-24 text-center text-ink-soft">الإجراءات</th>
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
                    className="border-b border-line cursor-pointer transition-colors hover:bg-surface-raised/40"
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
                        className="rounded text-action-primary"
                      />
                    </td>

                    {visibleColumns.map((col) => {
                      const val = item.data?.[col.key]
                      return (
                        <td key={col.key} className="p-4 font-medium">
                          {col.type === 'number' && typeof val === 'number'
                            ? val.toLocaleString('ar-EG')
                            : val ?? '-'}
                        </td>
                      )
                    })}

                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1 text-ink-muted">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="font-bold">{item.attachments?.length ?? 0}</span>
                      </div>
                    </td>

                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenItemForm(item)}
                          className="p-1 text-ink-muted hover:text-action-primary rounded-lg"
                        >
                          تعديل
                        </button>
                        <span className="text-ink-muted">|</span>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-ink-muted hover:text-danger rounded-lg"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
            {items.map((item) => (
              <article
                key={item.id}
                onClick={() => {
                  setSelectedItem(item)
                  setIsRowDrawerOpen(true)
                }}
                className="cursor-pointer rounded-2xl border border-line bg-surface p-4 shadow-sm transition-colors hover:bg-surface-subtle"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    {visibleColumns.slice(0, 3).map((col) => {
                      const val = item.data?.[col.key]
                      return (
                        <div key={col.key}>
                          <span className="block text-xs text-ink-muted">{col.label}</span>
                          <span className="text-sm font-semibold text-ink">
                            {col.type === 'number' && typeof val === 'number'
                              ? val.toLocaleString('ar-EG')
                              : val ?? '-'}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="rounded-xl bg-surface-subtle px-3 py-2 text-center">
                    <span className="block text-xs text-ink-muted">المرفقات</span>
                    <span className="text-sm font-bold text-ink">{item.attachments?.length ?? 0}</span>
                  </div>
                </div>

                {visibleColumns.length > 3 ? (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {visibleColumns.slice(3, 5).map((col) => {
                      const val = item.data?.[col.key]
                      return (
                        <div key={col.key} className="rounded-xl bg-surface-subtle px-3 py-2">
                          <span className="block text-xs text-ink-muted">{col.label}</span>
                          <span className="text-sm font-semibold text-ink">
                            {col.type === 'number' && typeof val === 'number'
                              ? val.toLocaleString('ar-EG')
                              : val ?? '-'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : null}

                <div className="mt-4 flex items-center justify-end gap-3">
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      handleOpenItemForm(item)
                    }}
                    className="flex min-h-11 items-center justify-center rounded-xl border border-info-soft bg-info-soft px-4 py-2 text-sm font-semibold text-action-primary"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      handleDeleteItem(item.id)
                    }}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-danger-soft bg-danger-soft px-4 py-2 text-danger"
                  >
                    حذف
                  </button>
                </div>
              </article>
            ))}
            </div>
          </>
        )}
      </div>

      {/* Row details Drawer & Streaming attachments */}
      {isRowDrawerOpen && selectedItem && (
        <div className="fixed inset-y-0 left-0 w-full sm:w-[500px] bg-surface border-r border-line shadow-2xl p-6 z-50 flex flex-col justify-between overflow-y-auto animate-slide-in">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-action-primary" />
                <h3 className="text-base font-bold text-ink font-sans">تفاصيل السجل والمستند</h3>
              </div>
              <button
                onClick={() => {
                  setIsRowDrawerOpen(false)
                  setStreamingAttachmentUrl(null)
                }}
                className="p-1.5 text-ink-muted hover:text-ink-soft rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic details */}
            <div className="bg-surface-subtle p-4 rounded-xl space-y-3">
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between items-center text-xs">
                  <span className="text-ink-muted font-semibold">{col.label}</span>
                  <span className="font-bold text-ink-soft">{selectedItem.data?.[col.key] ?? '-'}</span>
                </div>
              ))}
            </div>

            {/* Attachments Section */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-ink font-sans">مرفقات المستند ({selectedItem.attachments?.length ?? 0})</h4>
              
              <div className="space-y-2">
                {selectedItem.attachments?.map((attach: any) => (
                  <div key={attach.id} className="flex items-center justify-between p-3 bg-surface border border-line rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-ink-muted" />
                      <span className="font-semibold text-ink-soft line-clamp-1">{attach.original_name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenAttachmentPreview(attach.id)}
                        className="text-action-primary font-bold flex items-center gap-0.5 hover:underline"
                      >
                        {loadingAttachmentId === attach.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                        <span>{loadingAttachmentId === attach.id ? 'جاري التحميل...' : 'استعراض'}</span>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteAttachment(attach.id)}
                        className="text-danger font-bold"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Form */}
              <div className="border-2 border-dashed border-line p-4 rounded-xl flex flex-col items-center gap-3 bg-surface-muted/20/50">
                <input
                  type="file"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
                  className="text-xs text-ink-muted w-full"
                />
                <button
                  onClick={handleUploadAttachment}
                  disabled={uploadingAttachment || !attachmentFile}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-action-primary text-ink-inverse font-bold text-xs rounded-lg disabled:opacity-50"
                >
                  {uploadingAttachment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                  <span>رفع المرفق</span>
                </button>
              </div>
            </div>

            {/* Streaming preview panel */}
            {streamingAttachmentUrl && (
              <div className="border border-line rounded-xl overflow-hidden mt-6 shadow-sm">
                <div className="bg-surface-muted px-3 py-2 border-b border-line flex justify-between items-center text-xs">
                  <span className="font-bold text-ink-soft">معاينة المستند المباشر</span>
                  <button onClick={() => setStreamingAttachmentUrl(null)} className="text-danger font-bold">إغلاق</button>
                </div>
                <iframe
                  src={streamingAttachmentUrl}
                  className="w-full h-80 border-0 bg-surface"
                  title="Attachment preview"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      {showItemModal && (
        <AppDialog open={showItemModal} onClose={() => setShowItemModal(false)} panelClassName="max-w-lg">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-bold text-ink font-sans">
              {editingItem ? 'تعديل السجل المالي' : 'إضافة سجل مالي جديد'}
            </h2>

            <form onSubmit={handleSaveItem} className="mt-4 space-y-4">
              {itemFormError && (
                <div className="flex items-center gap-2 rounded-xl border border-danger-soft bg-danger-soft p-3 text-xs text-danger">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{itemFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {columns.map((col) => (
                  <div key={col.key}>
                    <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                      {col.label} {col.required && <span className="text-danger">*</span>}
                    </label>

                    {col.formula ? (
                      <div className="w-full px-4 py-2.5 bg-warning-soft/30 bg-warning-soft/40 border border-warning-soft border-warning-soft rounded-xl text-sm font-semibold text-warning-strong text-warning flex items-center justify-between">
                        <span>{typeof itemFormValues[col.key] === 'number' ? itemFormValues[col.key].toLocaleString('ar-EG') : '0'}</span>
                        <span className="text-xs bg-warning-soft bg-warning-soft px-2 py-0.5 rounded-full font-sans">معادلة حسابية</span>
                      </div>
                    ) : col.type === 'number' ? (
                      <input
                        type="number"
                        step="any"
                        value={itemFormValues[col.key] ?? ''}
                        onChange={(e) => setItemFormValues({ ...itemFormValues, [col.key]: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                        className="w-full px-4 py-2.5 bg-surface-muted border border-line rounded-xl text-sm focus:ring-2 focus:ring-farm-blue"
                      />
                    ) : col.type === 'date' ? (
                      <input
                        type="date"
                        value={itemFormValues[col.key] ?? ''}
                        onChange={(e) => setItemFormValues({ ...itemFormValues, [col.key]: e.target.value })}
                        className="w-full px-4 py-2.5 bg-surface-muted border border-line rounded-xl text-sm focus:ring-2 focus:ring-farm-blue"
                      />
                    ) : col.type === 'select' ? (
                      <select
                        value={itemFormValues[col.key] ?? ''}
                        onChange={(e) => setItemFormValues({ ...itemFormValues, [col.key]: e.target.value })}
                        className="w-full px-4 py-2.5 bg-surface-muted border border-line rounded-xl text-sm focus:ring-2 focus:ring-farm-blue"
                      >
                        <option value="">اختر خيار...</option>
                        {col.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : col.type === 'boolean' ? (
                      <select
                        value={itemFormValues[col.key] === true ? 'true' : itemFormValues[col.key] === false ? 'false' : ''}
                        onChange={(e) => setItemFormValues({ ...itemFormValues, [col.key]: e.target.value === '' ? '' : e.target.value === 'true' })}
                        className="w-full px-4 py-2.5 bg-surface-muted border border-line rounded-xl text-sm focus:ring-2 focus:ring-farm-blue"
                      >
                        <option value="">اختر...</option>
                        <option value="true">نعم</option>
                        <option value="false">لا</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={itemFormValues[col.key] ?? ''}
                        onChange={(e) => setItemFormValues({ ...itemFormValues, [col.key]: e.target.value })}
                        className="w-full px-4 py-2.5 bg-surface-muted border border-line rounded-xl text-sm focus:ring-2 focus:ring-farm-blue"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-muted hover:bg-surface-raised rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createItemMutation.isPending || updateItemMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-action-primary text-ink-inverse font-bold text-xs rounded-lg hover:bg-opacity-90 active:scale-[0.98]"
                >
                  {(createItemMutation.isPending || updateItemMutation.isPending) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>حفظ البيانات</span>
                </button>
              </div>
            </form>
          </div>
        </AppDialog>
      )}

      {/* Stats Config Add/Edit Modal */}
      {showStatsModal && (
        <AppDialog open={showStatsModal} onClose={() => { setShowStatsModal(false); setEditingStatsId(null) }} panelClassName="max-w-lg">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-xl" dir="rtl">
            <div className="flex justify-between items-center border-b border-line pb-3 mb-4">
              <h2 className="text-base font-bold text-ink font-sans flex items-center gap-2">
                <Sliders className="w-5 h-5 text-action-primary" />
                <span>{editingStatsId ? 'تعديل بطاقة التحليلات والمؤشرات' : 'إضافة بطاقة تحليلات جديدة'}</span>
              </h2>
              <button 
                onClick={() => {
                  setShowStatsModal(false)
                  setEditingStatsId(null)
                }} 
                className="text-ink-muted hover:text-ink-soft dark:hover:text-ink-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateStatsConfig} className="space-y-4">
              {/* Widget Name */}
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">عنوان المؤشر / البطاقة *</label>
                <input
                  type="text"
                  required
                  value={statsName}
                  onChange={(e) => setStatsName(e.target.value)}
                  placeholder="مثال: إجمالي الرواتب، متوسط المبيعات"
                  className="w-full px-4 py-2.5 bg-surface-muted border border-line rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Visual Chart Type */}
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">طريقة العرض البياني</label>
                  <select
                    value={statsChartType}
                    onChange={(e) => setStatsChartType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-surface-muted border border-line rounded-xl text-sm"
                  >
                    <option value="card">بطاقة رقمية بسيطة (KPI Card)</option>
                    <option value="bar">رسم بياني أعمدة (Bar Chart)</option>
                    <option value="pie">رسم بياني دائري (Donut/Pie Chart)</option>
                    <option value="line">منحنى خطي زمني (Line Chart)</option>
                    <option value="table">جدول ترتيب مقارن (List Table)</option>
                  </select>
                </div>

                {/* Aggregation Function */}
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">نوع التجميع (Aggregation)</label>
                  <select
                    value={statsAgg}
                    onChange={(e) => setStatsAgg(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-surface-muted border border-line rounded-xl text-sm"
                  >
                    <option value="count">عدد السجلات الإجمالي (Count)</option>
                    <option value="distinct_count">عدد فريد للقيم (Distinct Count)</option>
                    <option value="sum_total">مجموع الحقل المختار (Sum)</option>
                    <option value="sum_group">تجميع مجموع مجموعات (Sum Grouped)</option>
                    <option value="avg">المتوسط الحسابي للقيم (Average)</option>
                  </select>
                </div>
              </div>

              {/* Target Column selector */}
              {statsAgg !== 'count' && (
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">الحقل المستهدف للحساب</label>
                  <select
                    value={statsCol}
                    required
                    onChange={(e) => setStatsCol(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-muted border border-line rounded-xl text-sm"
                  >
                    <option value="">اختر حقل البيانات العددي...</option>
                    {columns.filter(c => c.type === 'number' || c.type === 'select' || c.type === 'text').map(col => (
                      <option key={col.key} value={col.key}>{col.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Group By selector (for charts) */}
              {(statsChartType !== 'card' || statsAgg === 'sum_group' || statsAgg === 'distinct_count') && (
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">حقل تصنيف المجموعات (Group By)</label>
                  <select
                    value={statsGroupBy}
                    required
                    onChange={(e) => setStatsGroupBy(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-muted border border-line rounded-xl text-sm"
                  >
                    <option value="">اختر حقل التصنيف (تاريخ، نص، خيار)...</option>
                    {columns.map(col => (
                      <option key={col.key} value={col.key}>{col.label}</option>
                    ))}
                  </select>
                  <span className="text-xs text-ink-muted mt-1 block">
                    يتم تقسيم الرسم البياني وتوزيعه ديناميكياً بناءً على هذا الحقل المختار.
                  </span>
                </div>
              )}

              {/* KPI Threshold Alert Rules */}
              <div className="border-t border-line pt-3">
                <h4 className="text-xs font-bold text-ink mb-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span>عتبة التنبيه الذكي (KPI Threshold Alerts)</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1">الشرط</label>
                    <select
                      value={statsThresholdCond}
                      onChange={(e) => setStatsThresholdCond(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-muted border border-line rounded-lg text-xs"
                    >
                      <option value="">بدون تنبيه</option>
                      <option value="gt">أكبر من (&gt;)</option>
                      <option value="lt">أصغر من (&lt;)</option>
                      <option value="eq">يساوي (=)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1">العتبة المستهدفة</label>
                    <input
                      type="number"
                      step="any"
                      value={statsThresholdVal}
                      onChange={(e) => setStatsThresholdVal(e.target.value)}
                      placeholder="مثال: 5000"
                      disabled={!statsThresholdCond}
                      className="w-full px-3 py-2 bg-surface-muted border border-line rounded-lg text-xs focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1">نوع التوهج والإنذار</label>
                    <select
                      value={statsThresholdAlert}
                      onChange={(e) => setStatsThresholdAlert(e.target.value as any)}
                      disabled={!statsThresholdCond}
                      className="w-full px-3 py-2 bg-surface-muted border border-line rounded-lg text-xs disabled:opacity-50"
                    >
                      <option value="negative">سلبي / إنذار (أحمر متوهج)</option>
                      <option value="positive">إيجابي / نجاح (أخضر متوهج)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Accent Widget Color Picker */}
              <div className="border-t border-line pt-3">
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">اللون الرئيسي للبطاقة والرسم البياني</label>
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { hex: '#3b82f6', label: 'أزرق' },
                    { hex: '#10b981', label: 'أخضر' },
                    { hex: '#f59e0b', label: 'برتقالي' },
                    { hex: '#ef4444', label: 'أحمر' },
                    { hex: '#8b5cf6', label: 'بنفسجي' },
                    { hex: '#ec4899', label: 'وردي' },
                    { hex: '#6366f1', label: 'نيلي' }
                  ].map((colorObj) => (
                    <button
                      key={colorObj.hex}
                      type="button"
                      onClick={() => setStatsColor(colorObj.hex)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                        statsColor === colorObj.hex ? 'scale-110 ring-2 ring-offset-2 ring-farm-blue' : 'opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: colorObj.hex }}
                      title={colorObj.label}
                    >
                      {statsColor === colorObj.hex && <CheckCircle className="w-3.5 h-3.5 text-ink-inverse" />}
                    </button>
                  ))}
                  
                  {/* Custom color input */}
                  <div className="flex items-center gap-1.5 border border-line rounded-lg p-1 mr-auto bg-surface-muted">
                    <input
                      type="color"
                      value={statsColor}
                      onChange={(e) => setStatsColor(e.target.value)}
                      className="w-6 h-6 border-0 bg-transparent cursor-pointer rounded"
                    />
                    <span className="text-xs text-ink-muted font-mono font-bold">{statsColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-line mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatsModal(false)
                    setEditingStatsId(null)
                  }}
                  className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-muted hover:bg-surface-raised rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-action-primary text-ink-inverse font-bold text-xs rounded-xl hover:bg-opacity-95 shadow-md active:scale-95 transition-colors"
                >
                  {editingStatsId ? 'حفظ التعديلات' : 'إضافة إلى اللوحة'}
                </button>
              </div>
            </form>
          </div>
        </AppDialog>
      )}

      {/* Excel Imports Fuzzy Matching Confirmation Dialog */}
      {showExcelModal && excelFile && (
        <AppDialog open={showExcelModal && !!excelFile} onClose={() => setShowExcelModal(false)} panelClassName="max-w-lg">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-line pb-4">
              <h2 className="text-base font-bold text-ink font-sans flex items-center gap-1.5 text-success">
                <FileSpreadsheet className="w-5 h-5" />
                <span>مطابقة وتأكيد ترويسات الاستيراد الذكي</span>
              </h2>
              <button onClick={() => setShowExcelModal(false)} className="text-ink-muted hover:text-ink-soft">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed mt-4">
              لقد قمنا بقراءة الأعمدة في ملف الإكسل ومطابقتها تقريبياً مع حقول النموذج. يرجى التحقق من صحة المطابقات وتعديل الخيارات الخاطئة قبل المتابعة.
            </p>

            <div className="mt-4 space-y-4">
              {excelHeaders.map((hdr) => (
                <div key={hdr} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-muted rounded-xl text-xs">
                  <div>
                    <span className="block text-xs text-ink-muted font-semibold">ترويسة ملف Excel</span>
                    <span className="font-bold text-ink-soft">{hdr}</span>
                  </div>

                  <div className="w-full sm:w-56">
                    <span className="block text-xs text-ink-muted font-semibold mb-1">المطابقة مع الحقل المستهدف</span>
                    <select
                      value={fuzzyMappings[hdr] ?? ''}
                      onChange={(e) => setFuzzyMappings({ ...fuzzyMappings, [hdr]: e.target.value })}
                      className="w-full p-2 border border-line bg-surface rounded-lg text-xs"
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

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-line mt-6">
              <button
                type="button"
                onClick={() => setShowExcelModal(false)}
                className="px-4 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-muted rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmExcelImport}
                disabled={excelImportLoading}
                className="flex items-center gap-2 rounded-lg bg-success px-5 py-2 text-xs font-bold text-ink-inverse hover:bg-opacity-95 disabled:opacity-50"
              >
                {excelImportLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>استيراد وحفظ السجلات</span>
              </button>
            </div>
          </div>
        </AppDialog>
      )}
    </div>
  )
}
