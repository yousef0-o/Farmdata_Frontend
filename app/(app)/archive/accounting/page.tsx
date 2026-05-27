'use client'

import React, { useState, useEffect } from 'react'
import {
  useAccountingAccounts,
  useCreateAccountingAccount,
  useRecordSheets,
  useCreateRecordSheet,
  useRecordSheet,
  useCloseRecordSheet,
  useCreateTransaction,
  useAnnualAccountingStats,
  useImportChartOfAccounts,
  useImportRecordTransactions,
  useDeleteAccountingAccount,
  useToggleAccountingAccountStatus
} from '@/lib/hooks/useArchive'
import {
  BookOpen,
  Plus,
  Coins,
  Receipt,
  UserCheck,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ListFilter,
  CheckCircle,
  FolderOpen,
  UploadCloud,
  FileSpreadsheet,
  Info,
  Check,
  ChevronDown,
  Search,
  Trash2,
  Power,
  Ban
} from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'accounts' | 'sheets'>('matrix')
  const [selectedYear, setSelectedYear] = useState<number>(2026)

  // Accounts Queries/Mutations
  const { data: accountsRes, isLoading: loadingAccounts } = useAccountingAccounts()
  const createAccountMutation = useCreateAccountingAccount()
  const deleteAccountMutation = useDeleteAccountingAccount()
  const toggleAccountStatusMutation = useToggleAccountingAccountStatus()

  const [newAccCode, setNewAccCode] = useState('')
  const [newAccName, setNewAccName] = useState('')
  const [newAccType, setNewAccType] = useState<'asset' | 'liability' | 'equity' | 'revenue' | 'expense'>('asset')
  const [newAccParentId, setNewAccParentId] = useState<number | null>(null)
  const [accError, setAccError] = useState('')
  const [deletingAccount, setDeletingAccount] = useState<any | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Chart of Accounts bulk import mutation and states
  const importCoaMutation = useImportChartOfAccounts()
  const [coaFile, setCoaFile] = useState<File | null>(null)
  const [coaDragActive, setCoaDragActive] = useState(false)
  const [coaImportSuccess, setCoaImportSuccess] = useState<string | null>(null)
  const [coaImportError, setCoaImportError] = useState<string | null>(null)

  // Sheets Queries/Mutations
  const [sheetFilterStatus, setSheetFilterStatus] = useState<'open' | 'closed' | undefined>(undefined)
  const { data: sheetsRes, isLoading: loadingSheets } = useRecordSheets(undefined, sheetFilterStatus)
  const createSheetMutation = useCreateRecordSheet()

  const [newSheetTitle, setNewSheetTitle] = useState('')
  const [newSheetAccountId, setNewSheetAccountId] = useState<number>(0)
  const [newSheetStart, setNewSheetStart] = useState('2026-01-01')
  const [newSheetEnd, setNewSheetEnd] = useState('2026-12-31')
  const [sheetError, setSheetError] = useState('')

  // Selected sheet details
  const [activeSheetId, setActiveSheetId] = useState<number | null>(null)
  const { data: sheetDetailRes, isLoading: loadingSheetDetail } = useRecordSheet(activeSheetId ?? 0)
  const closeSheetMutation = useCloseRecordSheet(activeSheetId ?? 0)
  const createTxMutation = useCreateTransaction(activeSheetId ?? 0)

  const [txDesc, setTxDesc] = useState('')
  const [txDebit, setTxDebit] = useState<number>(0)
  const [txCredit, setTxCredit] = useState<number>(0)
  const [txDate, setTxDate] = useState('2026-05-22')
  const [txRef, setTxRef] = useState('')
  const [txAccountId, setTxAccountId] = useState<number>(0)
  const [txError, setTxError] = useState('')

  // Ledger transactions bulk import mutation and states
  const [entryMode, setEntryMode] = useState<'manual' | 'import'>('manual')
  const importTxMutation = useImportRecordTransactions(activeSheetId ?? 0)
  const [txFile, setTxFile] = useState<File | null>(null)
  const [txDragActive, setTxDragActive] = useState(false)
  const [txImportSuccess, setTxImportSuccess] = useState<string | null>(null)
  const [txImportError, setTxImportError] = useState<string | null>(null)

  // Clean stale states on page/tab/sheet change to guarantee E. State Safety
  useEffect(() => {
    setAccError('')
    setSheetError('')
    setTxError('')
    setCoaFile(null)
    setCoaImportSuccess(null)
    setCoaImportError(null)
    setTxFile(null)
    setTxImportSuccess(null)
    setTxImportError(null)
    setDeletingAccount(null)
    setDeleteError(null)
  }, [activeTab])

  useEffect(() => {
    setTxError('')
    setTxFile(null)
    setTxImportSuccess(null)
    setTxImportError(null)
    setEntryMode('manual')
  }, [activeSheetId])

  // Annual matrix stats query
  const { data: matrixRes, isLoading: loadingMatrix } = useAnnualAccountingStats(selectedYear)

  const accounts = accountsRes?.data ?? []
  const sheets = sheetsRes?.data ?? []
  const currentSheet = sheetDetailRes?.data
  const matrixData = matrixRes?.data ?? []

  // --- Chart of Accounts Tree States & Helpers ---
  const [coaSearch, setCoaSearch] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({})

  // Convert flat list into a hierarchical tree
  const buildAccountTree = (list: any[]) => {
    const map: Record<number, any> = {}
    const roots: any[] = []

    list.forEach((item) => {
      map[item.id] = { ...item, children: [] }
    })

    list.forEach((item) => {
      const mapped = map[item.id]
      if (item.parent_id && map[item.parent_id]) {
        map[item.parent_id].children.push(mapped)
      } else {
        roots.push(mapped)
      }
    })

    const sortTree = (nodes: any[]) => {
      nodes.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
      nodes.forEach((node) => {
        if (node.children.length > 0) {
          sortTree(node.children)
        }
      })
    }

    sortTree(roots)
    return roots
  }

  const accountTree = React.useMemo(() => buildAccountTree(accounts), [accounts])

  const matchesSearch = (node: any, query: string): boolean => {
    if (!query) return true
    const q = query.toLowerCase()
    const selfMatch = node.name.toLowerCase().includes(q) || node.code.toLowerCase().includes(q)
    if (selfMatch) return true
    return node.children.some((child: any) => matchesSearch(child, query))
  }

  const getDescendants = (node: any): any[] => {
    let list: any[] = []
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        list.push(child)
        list = list.concat(getDescendants(child))
      }
    }
    return list
  }

  const handleExpandAll = () => {
    const expanded: Record<number, boolean> = {}
    accounts.forEach((acc: any) => {
      expanded[acc.id] = true
    })
    setExpandedNodes(expanded)
  }

  const handleCollapseAll = () => {
    setExpandedNodes({})
  }

  // Recursive Account Node Renderer
  const renderAccountNode = (node: any, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = !!expandedNodes[node.id] || coaSearch !== ''
    const isMatched = coaSearch ? (node.name.toLowerCase().includes(coaSearch.toLowerCase()) || node.code.toLowerCase().includes(coaSearch.toLowerCase())) : false
    const isSelectedParent = newAccParentId === node.id

    const visibleChildren = node.children.filter((child: any) => matchesSearch(child, coaSearch))

    if (coaSearch && !matchesSearch(node, coaSearch)) {
      return null
    }

    const typeConfig = {
      asset: {
        bg: 'bg-info-soft/40 border-info-soft hover:bg-info-soft/30',
        text: 'text-info',
        badge: 'bg-info-soft text-info border-info-soft',
        label: 'أصول'
      },
      liability: {
        bg: 'bg-danger-soft/40 border-danger-soft hover:bg-danger-soft/30',
        text: 'text-danger',
        badge: 'bg-danger-soft text-danger border-danger-soft',
        label: 'خصوم'
      },
      equity: {
        bg: 'bg-warning-soft/40 border-warning-soft hover:bg-warning-soft/30',
        text: 'text-warning-strong',
        badge: 'bg-warning-soft text-warning-strong border-warning-soft',
        label: 'حقوق ملكية'
      },
      revenue: {
        bg: 'bg-success-soft/40 border-success-soft hover:bg-success-soft/30',
        text: 'text-success-strong',
        badge: 'bg-success-soft text-success-strong border-success-soft',
        label: 'إيرادات'
      },
      expense: {
        bg: 'bg-surface-subtle border-line hover:bg-surface-muted',
        text: 'text-action-secondary',
        badge: 'bg-surface-muted text-action-secondary border-line',
        label: 'مصروفات'
      }
    }[node.type as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense']

    const toggleExpand = (e: React.MouseEvent) => {
      e.stopPropagation()
      setExpandedNodes(prev => ({ ...prev, [node.id]: !prev[node.id] }))
    }

    const selectAsParent = (e: React.MouseEvent) => {
      e.stopPropagation()
      setNewAccParentId(node.id)
      setNewAccType(node.type)
      document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
      <div key={node.id} className="relative select-none">
        {/* Branch connector lines */}
        {depth > 0 && (
          <div 
            className="absolute right-0 top-0 bottom-0 border-r-2 border-dashed border-line" 
            style={{ 
              right: `${(depth - 1) * 24 + 18}px`, 
              width: '2px',
              top: '-14px',
              height: hasChildren && isExpanded ? '30px' : 'calc(100% - 12px)'
            }} 
          />
        )}
        
        {depth > 0 && (
          <div 
            className="absolute border-t-2 border-dashed border-line" 
            style={{ 
              right: `${(depth - 1) * 24 + 18}px`, 
              width: '12px', 
              top: '20px' 
            }} 
          />
        )}

        <div
          onClick={hasChildren ? toggleExpand : undefined}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors cursor-pointer ${
            isSelectedParent 
              ? 'border-action-primary bg-info-soft/20 ring-1 ring-action-primary shadow-sm'
              : isMatched 
              ? 'border-warning bg-warning-soft/40 shadow-sm font-bold'
              : `border-line bg-surface-subtle ${typeConfig.bg}`
          } ${node.is_active === false ? 'opacity-60 dark:opacity-55 grayscale-[20%]' : ''}`}
          style={{ marginRight: `${depth * 24}px` }}
        >
          <div className="flex items-center gap-3">
            {/* Interactive Toggle Button */}
            {hasChildren ? (
              <button
                onClick={toggleExpand}
                className="p-1 rounded-lg text-ink-muted transition-transform duration-200 hover:bg-surface-raised/50"
                style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(90deg)' }}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center">
                <div className={`w-1.5 h-1.5 rounded-full ${typeConfig.text} bg-current opacity-60`} />
              </div>
            )}

            {/* Folder/Doc Icon */}
            <div className={`p-1.5 rounded-xl bg-surface shadow-sm ${typeConfig.text}`}>
              {hasChildren ? (
                <FolderOpen className="w-4 h-4" />
              ) : (
                <Receipt className="w-4 h-4" />
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-bold font-mono tracking-wide text-ink-muted text-xs">
                {node.code}
              </span>
              <span className={`text-sm ${isSelectedParent ? 'text-action-primary font-bold' : isMatched ? 'text-warning font-bold' : 'text-ink font-semibold'}`}>
                {node.name}
              </span>
            </div>
          </div>

          {/* Action badges and controls */}
          <div className="flex items-center gap-2">
            {/* Active status badge */}
            {node.is_active === false && (
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold border bg-surface-muted text-ink-muted border-line">
                معطّل
              </span>
            )}

            {/* Type badge */}
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${typeConfig.badge}`}>
              {typeConfig.label}
            </span>

            {/* Quick Add Subaccount Button */}
            {node.is_leaf !== false && (
              <button
                onClick={selectAsParent}
                title="إضافة حساب فرعي تحت هذا الحساب"
                className="p-1 hover:bg-action-primary hover:text-ink-inverse dark:hover:bg-action-primary rounded-lg text-ink-muted hover:scale-105 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quick Deactivate / Activate Toggle Button */}
            <button
              disabled={toggleAccountStatusMutation.isPending}
              onClick={(e) => {
                e.stopPropagation()
                toggleAccountStatusMutation.mutate({ id: node.id, isActive: node.is_active === false })
              }}
              title={node.is_active !== false ? 'تعطيل الحساب المالي (تجميد)' : 'تفعيل الحساب المالي (إعادة تنشيط)'}
              className={`p-1 rounded-lg hover:scale-105 transition-colors cursor-pointer ${
                node.is_active !== false
                  ? 'hover:bg-warning hover:text-ink-inverse text-ink-muted'
                  : 'hover:bg-success hover:text-ink-inverse text-success'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
            </button>

            {/* Quick Delete Account Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeleteError(null)
                setDeletingAccount(node)
              }}
              title="حذف هذا الحساب المالي"
              className="p-1 rounded-lg text-ink-muted transition-colors hover:scale-105 hover:bg-danger-soft hover:text-ink-inverse"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Render child nodes recursively */}
        {hasChildren && isExpanded && (
          <div className="mt-1.5 space-y-1.5">
            {visibleChildren.map((child: any) => renderAccountNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  // --- Handlers ---
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setAccError('')
    if (!newAccCode || !newAccName) {
      setAccError('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    try {
      await createAccountMutation.mutateAsync({
        code: newAccCode,
        name: newAccName,
        type: newAccType,
        parent_id: newAccParentId || undefined
      })
      setNewAccCode('')
      setNewAccName('')
      setNewAccParentId(null)
    } catch (err: any) {
      setAccError(err?.message || 'فشل إضافة الحساب')
    }
  }

  const handleCreateSheet = async (e: React.FormEvent) => {
    e.preventDefault()
    setSheetError('')
    if (!newSheetTitle || !newSheetAccountId) {
      setSheetError('يرجى تحديد العنوان والحساب المحاسبي المرتبط')
      return
    }

    try {
      await createSheetMutation.mutateAsync({
        title: newSheetTitle,
        account_id: newSheetAccountId,
        period_start: newSheetStart,
        period_end: newSheetEnd
      })
      setNewSheetTitle('')
    } catch (err: any) {
      setSheetError(err?.message || 'فشل فتح دفتر يومية جديد')
    }
  }

  const handlePostTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    setTxError('')
    if (!txAccountId || (txDebit === 0 && txCredit === 0)) {
      setTxError('يجب تحديد حساب ورقم مدين أو دائن صالح')
      return
    }

    try {
      await createTxMutation.mutateAsync({
        account_id: txAccountId,
        description: txDesc || undefined,
        debit: txDebit,
        credit: txCredit,
        transaction_date: txDate,
        reference: txRef || undefined
      })
      setTxDesc('')
      setTxDebit(0)
      setTxCredit(0)
      setTxRef('')
    } catch (err: any) {
      setTxError(err?.message || 'فشل تسجيل القيد المحاسبي')
    }
  }

  const handleCloseSheet = async () => {
    if (!confirm('تحذير: إغلاق الدفتر سيجعله غير قابل للتعديل بشكل نهائي لحماية السجلات. هل أنت متأكد؟')) return
    try {
      await closeSheetMutation.mutateAsync()
      alert('تم إغلاق الفترة المحاسبية بنجاح وتثبيت السجلات!')
    } catch (err: any) {
      alert('فشل إغلاق الدفتر: ' + err?.message)
    }
  }

  // Monthly columns helper for matrix
  const months = [
    { num: 1, name: 'يناير' },
    { num: 2, name: 'فبراير' },
    { num: 3, name: 'مارس' },
    { num: 4, name: 'أبريل' },
    { num: 5, name: 'مايو' },
    { num: 6, name: 'يونيو' },
    { num: 7, name: 'يوليو' },
    { num: 8, name: 'أغسطس' },
    { num: 9, name: 'سبتمبر' },
    { num: 10, name: 'أكتوبر' },
    { num: 11, name: 'نوفمبر' },
    { num: 12, name: 'ديسمبر' }
  ]

  // Dynamic leaf and auto-distribution helpers for current sheet
  const isLeafAccount = currentSheet?.account?.is_leaf !== false && !accounts.some(a => a.parent_id === currentSheet?.account_id)
  const isAutoDistribute = !!(currentSheet?.folder?.meta?.distribute_by_production && currentSheet?.folder?.meta?.company_id)

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-2xl border border-line shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-action-primary text-ink-inverse rounded-2xl shadow-sm">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink font-sans">الدفاتر اليومية والحسابات المحاسبية</h1>
            <p className="text-xs text-ink-muted mt-1">التقارير السنوية المتقاطعة، دليل الحسابات الشجري، والتسجيل المزدوج للقيود</p>
          </div>
        </div>

        {/* Tab triggers */}
        <div className="flex items-center gap-1.5 p-1.5 bg-surface-muted rounded-xl border border-line w-full md:w-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'matrix' ? 'bg-surface text-action-primary shadow-sm' : 'text-ink-muted hover:text-ink-soft'
            }`}
          >
            الجدول السنوي
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'accounts' ? 'bg-surface text-action-primary shadow-sm' : 'text-ink-muted hover:text-ink-soft'
            }`}
          >
            دليل الحسابات
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'sheets' ? 'bg-surface text-action-primary shadow-sm' : 'text-ink-muted hover:text-ink-soft'
            }`}
          >
            الدفاتر والسجلات
          </button>
        </div>
      </div>

      {/* MATRIX TAB CONTENT */}
      {activeTab === 'matrix' && (
        <div className="bg-surface border border-line rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-ink font-sans">المصفوفة المحاسبية السنوية للأرباح والمصروفات</h3>
              <p className="text-xs text-ink-muted mt-1">الرصد الشهري المتكامل للتدفقات المحاسبية لعام {selectedYear}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted font-semibold">تصفية السنة:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="p-2 border border-line bg-surface-muted text-xs font-bold rounded-lg"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>
          </div>

          {loadingMatrix ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-action-primary animate-spin" />
              <span className="text-ink-muted text-xs mt-3">جاري توليد المصفوفة المحاسبية...</span>
            </div>
          ) : matrixData.length === 0 ? (
            <div className="text-center py-16 text-ink-muted text-xs font-semibold">
              لا توجد حركة قيود أو دفاتر محاسبية مقيدة لعام {selectedYear} حتى الآن.
            </div>
          ) : (
            <div className="overflow-x-auto border border-line rounded-xl">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-subtle border-b border-line text-ink-muted font-bold">
                    <th className="p-3 font-sans w-48 sticky right-0 bg-surface-muted border-l border-line">كود واسم الحساب</th>
                    {months.map((m) => (
                      <th key={m.num} className="p-3 font-sans text-center min-w-[70px]">{m.name}</th>
                    ))}
                    <th className="p-3 font-sans text-center bg-surface-muted w-24">إجمالي السنوي</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixData.map((row: any) => {
                    let totalVal = 0
                    return (
                      <tr key={row.account_id} className="border-b border-line hover:bg-surface-muted/50">
                        <td className="p-3 font-bold text-ink sticky right-0 bg-surface border-l border-line">
                          {row.account_code} - {row.account_name}
                        </td>
                        {months.map((m) => {
                          const val = row.months?.[m.num] ?? 0
                          totalVal += val
                          return (
                            <td key={m.num} className={`p-3 text-center font-medium ${val > 0 ? 'text-success font-bold' : val < 0 ? 'text-danger font-bold' : 'text-ink-muted'}`}>
                              {val !== 0 ? val.toLocaleString('ar-EG') : '-'}
                            </td>
                          )
                        })}
                        <td className={`p-3 text-center font-bold bg-surface-subtle/20 ${totalVal > 0 ? 'text-success' : totalVal < 0 ? 'text-danger' : 'text-ink-muted'}`}>
                          {totalVal !== 0 ? totalVal.toLocaleString('ar-EG') : '0'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ACCOUNTS TAB CONTENT */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Sidebar Column: Create Form & Excel Bulk Import */}
          <div className="lg:col-span-1 space-y-6">
            {/* Create Account Form */}
            <div className="bg-surface border border-line p-6 rounded-2xl shadow-sm h-fit">
              <h3 className="text-sm font-bold text-ink font-sans flex items-center gap-1">
                <Coins className="w-4 h-4 text-action-primary" />
                <span>إضافة حساب محاسبي جديد</span>
              </h3>

              <form onSubmit={handleCreateAccount} className="mt-4 space-y-4 text-xs">
                {accError && (
                  <div className="flex items-center gap-2 p-3 bg-danger-soft bg-danger-soft border border-danger-soft text-danger rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                    <span>{accError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-ink-soft mb-1.5">كود الحساب (رقمي فريد)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 1101"
                    value={newAccCode}
                    onChange={(e) => setNewAccCode(e.target.value)}
                    className="w-full p-2.5 bg-surface-muted border border-line rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-soft mb-1.5">اسم الحساب</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: نقدية البنك الأهلي"
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    className="w-full p-2.5 bg-surface-muted border border-line rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-soft mb-1.5">نوع التصنيف الرئيسي</label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as any)}
                    className="w-full p-2.5 bg-surface-muted border border-line rounded-xl focus:outline-none"
                  >
                    <option value="asset">الأصول (Assets)</option>
                    <option value="liability">الخصوم (Liabilities)</option>
                    <option value="equity">حقوق الملكية (Equity)</option>
                    <option value="revenue">الإيرادات (Revenues)</option>
                    <option value="expense">المصروفات (Expenses)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink-soft mb-1.5">الحساب الأب (إن وجد)</label>
                  <select
                    value={newAccParentId ?? ''}
                    onChange={(e) => setNewAccParentId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full p-2.5 bg-surface-muted border border-line rounded-xl focus:outline-none"
                  >
                    <option value="">حساب رئيسي (بدون أب)</option>
                    {accounts.filter(acc => acc.is_active !== false).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={createAccountMutation.isPending}
                  className="w-full py-2.5 bg-action-primary text-ink-inverse font-bold rounded-xl shadow-md hover:bg-opacity-95 disabled:opacity-50 hover:scale-[1.01] transition-colors cursor-pointer"
                >
                  {createAccountMutation.isPending ? 'جاري الحفظ...' : 'حفظ الحساب'}
                </button>
              </form>
            </div>

          {/* Chart of Accounts Bulk Import */}
          <div className="bg-surface border border-line p-6 rounded-2xl shadow-sm h-fit mt-6">
            <h3 className="text-sm font-bold text-ink font-sans flex items-center gap-1.5">
              <FileSpreadsheet className="w-4.5 h-4.5 text-action-primary" />
              <span>استيراد دليل الحسابات (دفعة واحدة)</span>
            </h3>
            
            <div className="mt-4 space-y-4 text-xs font-sans">
              {coaImportSuccess && (
                <div className="flex items-start gap-2 rounded-xl border border-success-soft bg-success-soft p-3 text-success">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <span className="font-bold">{coaImportSuccess}</span>
                    <p className="text-xs text-success">تم تحديث شجرة الحسابات تلقائياً وحساب الفروع الهرمية.</p>
                  </div>
                </div>
              )}

              {coaImportError && (
                <div className="flex items-start gap-2 p-3 bg-danger-soft bg-danger-soft border border-danger-soft text-danger rounded-xl">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <span className="font-bold">فشل الاستيراد:</span>
                    <p className="text-xs whitespace-pre-wrap">{coaImportError}</p>
                  </div>
                </div>
              )}

              <div
                onDragOver={(e) => { e.preventDefault(); setCoaDragActive(true) }}
                onDragLeave={() => setCoaDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setCoaDragActive(false)
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setCoaFile(e.dataTransfer.files[0])
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
                  coaDragActive
                    ? 'border-action-primary bg-info-soft/10'
                    : coaFile
                    ? 'border-success bg-success-soft/5'
                    : 'border-line hover:border-action-primary'
                }`}
                onClick={() => document.getElementById('coa-file-input')?.click()}
              >
                <input
                  id="coa-file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCoaFile(e.target.files[0])
                    }
                  }}
                />
                
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className={`p-2.5 rounded-xl ${coaFile ? 'bg-success-soft text-success' : 'bg-info-soft text-action-primary'}`}>
                    <UploadCloud className="w-5.5 h-5.5" />
                  </div>
                  {coaFile ? (
                    <div className="space-y-1">
                      <p className="font-bold text-ink max-w-[200px] truncate">{coaFile.name}</p>
                      <p className="text-xs text-ink-muted">{(coaFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-bold text-ink-soft">اسحب وأفلت ملف الـ Excel هنا</p>
                      <p className="text-xs text-ink-muted">أو اضغط لتصفح الملفات من جهازك</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between gap-2.5">
                {coaFile && (
                  <button
                    type="button"
                    onClick={() => setCoaFile(null)}
                    disabled={importCoaMutation.isPending}
                    className="px-3.5 py-2 bg-surface-muted hover:bg-surface-muted border border-line text-ink-muted font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (!coaFile) return
                    setCoaImportSuccess(null)
                    setCoaImportError(null)
                    const fd = new FormData()
                    fd.append('file', coaFile)
                    try {
                      const res = await importCoaMutation.mutateAsync(fd)
                      setCoaImportSuccess(`تم استيراد دليل الحسابات بنجاح. تمت إضافة ${res.data.inserted_accounts} حساب، وتحديث ${res.data.updated_accounts} حساب من أصل ${res.data.total_rows} صف.`);
                      setCoaFile(null)
                    } catch (err: any) {
                      setCoaImportError(err?.message || 'تعذر معالجة واستيراد الملف. تأكد من مطابقة هيكل البيانات والمسميات.')
                    }
                  }}
                  disabled={!coaFile || importCoaMutation.isPending}
                  className="flex-1 py-2 bg-action-primary text-ink-inverse font-bold rounded-xl shadow-md hover:bg-opacity-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {importCoaMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الاستيراد والربط الهرمي...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>بدء استيراد دليل الحسابات</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Column: Interactive Collapsible Tree View of Accounts */}
          <div className="bg-surface border border-line p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <h3 className="text-sm font-bold text-ink font-sans">دليل الحسابات المحاسبي (Chart of Accounts)</h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">تصفح الهيكل الشجري التفاعلي للحسابات وتفريعها الهرمي</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="px-3 py-1.5 text-xs font-bold text-action-primary bg-info-soft/70 hover:bg-info-soft border border-info-soft rounded-xl transition-colors cursor-pointer hover:scale-[1.02]"
                >
                  توسيع الكل
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="px-3 py-1.5 text-xs font-bold text-ink-muted bg-surface-muted hover:bg-surface-muted border border-line rounded-xl transition-colors cursor-pointer hover:scale-[1.02]"
                >
                  طي الكل
                </button>
              </div>
            </div>

            {/* Search filter input */}
            <div className="relative">
              <input
                type="text"
                placeholder="البحث بكود الحساب أو الاسم..."
                value={coaSearch}
                onChange={(e) => setCoaSearch(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 bg-surface-muted border border-line rounded-xl text-xs focus:outline-none"
              />
              <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-ink-muted" />
            </div>
            
            {loadingAccounts ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-action-primary" /></div>
            ) : accounts.length === 0 ? (
              <p className="text-ink-muted text-xs">لا يوجد حسابات مضافة حالياً.</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {accountTree.map((node) => renderAccountNode(node))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHEETS TAB CONTENT */}
      {activeTab === 'sheets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Sheets List */}
          <div className="bg-surface border border-line p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-sm font-bold text-ink font-sans flex items-center gap-1.5">
                <Receipt className="w-5 h-5 text-action-primary" />
                <span>دفاتر السجلات المفتوحة</span>
              </h3>
              
              <select
                value={sheetFilterStatus ?? ''}
                onChange={(e) => setSheetFilterStatus(e.target.value ? e.target.value as any : undefined)}
                className="p-1 border border-line rounded bg-surface-muted text-xs"
              >
                <option value="">الكل</option>
                <option value="open">مفتوح</option>
                <option value="closed">مغلق</option>
              </select>
            </div>

            {loadingSheets ? (
              <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-action-primary" /></div>
            ) : sheets.length === 0 ? (
              <p className="text-ink-muted text-xs">لا يوجد دفاتر قيود مسجلة.</p>
            ) : (
              <div className="space-y-2">
                {sheets.map((sheet) => (
                  <div
                    key={sheet.id}
                    onClick={() => setActiveSheetId(sheet.id)}
                    className={`p-4 bg-surface-muted hover:bg-surface-muted hover:bg-surface-raised rounded-xl border cursor-pointer transition-colors ${
                      activeSheetId === sheet.id ? 'border-action-primary bg-info-soft/10' : 'border-line'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-ink">{sheet.title}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        sheet.status === 'open' ? 'bg-success-soft text-success' : 'bg-surface-muted text-ink-muted'
                      }`}>
                        {sheet.status === 'open' ? 'نشط ومفتوح' : 'مغلق ومؤرشف'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-ink-muted mt-2">
                      <span>الحساب: {sheet.account?.name}</span>
                      <span>الفترة: {sheet.period_start}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Open Sheet Form */}
            <div className="border-t border-line pt-4 mt-6">
              <h4 className="text-xs font-bold text-ink font-sans">فتح دفتر يومية محاسبي جديد</h4>
              <form onSubmit={handleCreateSheet} className="mt-3 space-y-3 text-xs">
                {sheetError && <p className="text-danger font-bold">{sheetError}</p>}
                
                <input
                  type="text"
                  required
                  placeholder="عنوان السجل (مثال: دفاتر يناير 2026)"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  className="w-full p-2 bg-surface-muted border border-line rounded-lg focus:outline-none"
                />

                <select
                  required
                  value={newSheetAccountId}
                  onChange={(e) => setNewSheetAccountId(parseInt(e.target.value))}
                  className="w-full p-2 bg-surface-muted border border-line rounded-lg focus:outline-none"
                >
                  <option value="">اختر حساب الربط...</option>
                  {accounts.filter(acc => acc.is_active !== false).map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    required
                    value={newSheetStart}
                    onChange={(e) => setNewSheetStart(e.target.value)}
                    className="w-1/2 p-2 bg-surface-muted border border-line rounded-lg text-xs"
                  />
                  <input
                    type="date"
                    required
                    value={newSheetEnd}
                    onChange={(e) => setNewSheetEnd(e.target.value)}
                    className="w-1/2 p-2 bg-surface-muted border border-line rounded-lg text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createSheetMutation.isPending}
                  className="w-full py-2 bg-action-primary text-ink-inverse font-bold rounded-lg hover:bg-opacity-95"
                >
                  فتح الدفتر الآن
                </button>
              </form>
            </div>
          </div>

          {/* Sheet transactions Explorer & Ledger Postings */}
          <div className="bg-surface border border-line p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-6">
            {!activeSheetId ? (
              <div className="flex flex-col items-center justify-center py-20 text-ink-muted text-xs font-semibold">
                <FolderOpen className="w-12 h-12 text-ink-muted" />
                <span className="mt-3">يرجى تحديد أحد دفاتر القيود النشطة من القائمة الجانبية لاستعراض قيود اليومية.</span>
              </div>
            ) : loadingSheetDetail ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-action-primary" /></div>
            ) : !currentSheet ? (
              <p className="text-danger text-xs">تعذر جلب تفاصيل السجل المالي.</p>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-ink font-sans">{currentSheet.title}</h3>
                    <p className="text-xs text-ink-muted mt-1">
                      حساب السيطرة: {currentSheet.account?.name} | حالة الدفتر: {currentSheet.status === 'open' ? 'نشط' : 'مغلق ومثبت'}
                    </p>
                  </div>

                  {currentSheet.status === 'open' && (
                    <button
                      onClick={handleCloseSheet}
                      disabled={closeSheetMutation.isPending}
                      className="px-4 py-2 bg-warning hover:bg-warning-strong text-ink-inverse font-bold text-xs rounded-xl shadow transition-colors"
                    >
                      إغلاق وتجميد الفترة
                    </button>
                  )}
                </div>

                {/* Transactions Ledger Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-ink-soft font-sans">جدول قيود اليومية المقيدة ({currentSheet.transactions?.length ?? 0})</h4>
                  {currentSheet.transactions?.length === 0 ? (
                    <div className="rounded-2xl border border-line bg-surface-subtle p-4 text-center text-sm text-ink-muted">
                      لا يوجد قيود يومية مقيدة في هذا الدفتر بعد.
                    </div>
                  ) : (
                    <>
                      <div className="hidden overflow-x-auto rounded-xl border border-line text-xs lg:block">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="bg-surface-subtle border-b border-line text-ink-muted font-bold">
                              <th className="p-3 font-sans">التاريخ</th>
                              <th className="p-3 font-sans">البيان / الوصف</th>
                              <th className="p-3 font-sans">الحساب المقابل</th>
                              <th className="p-3 font-sans text-center">مدين (+)</th>
                              <th className="p-3 font-sans text-center">دائن (-)</th>
                              <th className="p-3 font-sans">المرجع</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentSheet.transactions?.map((tx) => (
                              <tr key={tx.id} className="border-b border-line">
                                <td className="p-3 font-medium">{tx.transaction_date}</td>
                                <td className="p-3 text-ink-soft">{tx.description ?? '-'}</td>
                                <td className="p-3 font-bold">{tx.account?.name}</td>
                                <td className="p-3 text-center text-success font-bold">{tx.debit > 0 ? tx.debit.toLocaleString('ar-EG') : '-'}</td>
                                <td className="p-3 text-center text-danger font-bold">{tx.credit > 0 ? tx.credit.toLocaleString('ar-EG') : '-'}</td>
                                <td className="p-3 text-ink-muted font-semibold">{tx.reference ?? '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:hidden">
                      {currentSheet.transactions?.map((tx) => (
                        <article
                          key={tx.id}
                          className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-ink">{tx.account?.name}</p>
                              <p className="text-xs text-ink-muted">{tx.transaction_date}</p>
                            </div>
                            <div className="rounded-xl bg-surface-subtle px-3 py-2 text-right">
                              <span className="block text-xs text-ink-muted">المرجع</span>
                              <span className="text-sm font-semibold text-ink">{tx.reference ?? '-'}</span>
                            </div>
                          </div>

                          <div className="mt-4 rounded-xl bg-surface-subtle px-3 py-2">
                            <span className="block text-xs text-ink-muted">البيان / الوصف</span>
                            <span className="text-sm text-ink-soft">{tx.description ?? '-'}</span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl bg-surface-subtle px-3 py-2">
                              <span className="block text-xs text-ink-muted">مدين (+)</span>
                              <span className="font-semibold text-success">
                                {tx.debit > 0 ? tx.debit.toLocaleString('ar-EG') : '-'}
                              </span>
                            </div>
                            <div className="rounded-xl bg-surface-subtle px-3 py-2">
                              <span className="block text-xs text-ink-muted">دائن (-)</span>
                              <span className="font-semibold text-danger">
                                {tx.credit > 0 ? tx.credit.toLocaleString('ar-EG') : '-'}
                              </span>
                            </div>
                          </div>
                        </article>
                      ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Post Transaction Form or Excel Ingest */}
                {currentSheet.status === 'open' && (
                  <div className="p-5 bg-surface border border-line rounded-2xl space-y-4 shadow-sm">
                    {/* Horizontal switcher for Manual Post vs Excel Import */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-3 gap-2">
                      <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-xl w-fit">
                        <button
                          type="button"
                          onClick={() => setEntryMode('manual')}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                            entryMode === 'manual'
                              ? 'bg-surface text-action-primary shadow-sm border border-line'
                              : 'text-ink-muted hover:text-ink-soft'
                          }`}
                        >
                          تسجيل قيد يدوي
                        </button>
                        <button
                          type="button"
                          onClick={() => setEntryMode('import')}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                            entryMode === 'import'
                              ? 'bg-surface text-action-primary shadow-sm border border-line'
                              : 'text-ink-muted hover:text-ink-soft'
                          }`}
                        >
                          استيراد قيود من Excel
                        </button>
                      </div>

                      {/* Display warning if auto-distribution is enabled for this sheet's folder */}
                      {isAutoDistribute && (
                        <span className="flex items-center gap-1 rounded-lg border border-warning-soft bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning animate-pulse">
                          <AlertCircle className="w-3.5 h-3.5 text-warning" />
                          <span>توزيع تلقائي تناسبي</span>
                        </span>
                      )}
                    </div>

                    {!isLeafAccount ? (
                      <div className="flex items-start gap-2.5 p-3.5 bg-danger-soft bg-danger-soft border border-danger-soft text-danger rounded-xl text-xs">
                        <AlertCircle className="w-4.5 h-4.5 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-bold">تنبيه الحساب الرئيسي غير الطرفي:</span>
                          <p className="text-xs mt-1 text-danger/90 leading-relaxed">
                            لا يمكن تسجيل قيود أو استيراد حركات مالية على الحساب المحاسبي الحالي [{currentSheet.account?.code}] {currentSheet.account?.name} لأنه حساب رئيسي.
                            التسجيل والتكامل المالي مسموح فقط على الحسابات الفرعية الطرفية (Terminal Leaf Nodes).
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* MANUAL ENTRY */}
                        {entryMode === 'manual' && (
                          <div className="space-y-3 font-sans">
                            {txError && <p className="text-danger font-bold text-xs">{txError}</p>}
                            
                            <form onSubmit={handlePostTransaction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                              <div>
                                <label className="block text-xs text-ink-muted font-semibold mb-1">الحساب المقابل</label>
                                <select
                                  required
                                  value={txAccountId}
                                  onChange={(e) => setTxAccountId(parseInt(e.target.value))}
                                  className="w-full p-2 border border-line bg-surface rounded-lg text-xs"
                                >
                                  <option value="">اختر حساب...</option>
                                  {accounts.filter(acc => acc.is_active !== false).map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs text-ink-muted font-semibold mb-1">البيان / الوصف</label>
                                <input
                                  type="text"
                                  placeholder="مثال: دفعة فواتير مشتريات الأعلاف"
                                  value={txDesc}
                                  onChange={(e) => setTxDesc(e.target.value)}
                                  className="w-full p-2 border border-line bg-surface rounded-lg text-xs"
                                />
                              </div>

                              <div className="flex gap-2">
                                <div className="w-1/2">
                                  <label className="block text-xs text-ink-muted font-semibold mb-1">مدين (+)</label>
                                  <input
                                    type="number"
                                    step="any"
                                    value={txDebit === 0 ? '' : txDebit}
                                    onChange={(e) => setTxDebit(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                    className="w-full p-2 border border-line bg-surface rounded-lg text-xs font-bold text-success"
                                  />
                                </div>
                                <div className="w-1/2">
                                  <label className="block text-xs text-ink-muted font-semibold mb-1">دائن (-)</label>
                                  <input
                                    type="number"
                                    step="any"
                                    value={txCredit === 0 ? '' : txCredit}
                                    onChange={(e) => setTxCredit(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                    className="w-full p-2 border border-line bg-surface rounded-lg text-xs font-bold text-danger"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs text-ink-muted font-semibold mb-1">تاريخ القيد</label>
                                <input
                                  type="date"
                                  required
                                  value={txDate}
                                  onChange={(e) => setTxDate(e.target.value)}
                                  className="w-full p-2 border border-line bg-surface rounded-lg text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-xs text-ink-muted font-semibold mb-1">الرقم المرجعي / الفاتورة</label>
                                <input
                                  type="text"
                                  placeholder="مثال: INV-9821"
                                  value={txRef}
                                  onChange={(e) => setTxRef(e.target.value)}
                                  className="w-full p-2 border border-line bg-surface rounded-lg text-xs"
                                />
                              </div>

                              <div className="flex items-end">
                                <button
                                  type="submit"
                                  disabled={createTxMutation.isPending}
                                  className="w-full py-2 bg-action-primary text-ink-inverse font-bold rounded-lg hover:bg-opacity-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  {createTxMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                  <span>ترحيل القيد</span>
                                </button>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* EXCEL BULK UPLOAD */}
                        {entryMode === 'import' && (
                          <div className="space-y-4 font-sans text-xs">
                            <div className="space-y-1">
                              <p className="text-xs text-ink-muted leading-relaxed">
                                قم برفع ورقة عمل قيود اليومية. يجب أن يحتوي الملف على أعمدة باسم (التاريخ، الوصف، مدين، دائن، الحساب المقابل، الرقم المرجعي).
                              </p>
                            </div>

                            {txImportSuccess && (
                              <div className="flex items-start gap-2 rounded-xl border border-success-soft bg-success-soft p-3 text-success">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div className="space-y-1">
                                  <span className="font-bold">{txImportSuccess}</span>
                                  <p className="text-xs text-success">تم تسجيل كافة المعاملات وتحديث أرصدة الحسابات بنجاح.</p>
                                </div>
                              </div>
                            )}

                            {txImportError && (
                              <div className="flex items-start gap-2 p-3 bg-danger-soft bg-danger-soft border border-danger-soft text-danger rounded-xl">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div className="space-y-1">
                                  <span className="font-bold">فشل الاستيراد:</span>
                                  <p className="text-xs whitespace-pre-wrap">{txImportError}</p>
                                </div>
                              </div>
                            )}

                            {isAutoDistribute && (
                              <div className="flex items-start gap-2 rounded-xl border border-warning-soft bg-warning-soft p-3 text-warning leading-relaxed">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-warning" />
                                <div>
                                  <span className="font-bold">تنبيه التوزيع التلقائي للمصاريف:</span>
                                  <p className="text-xs mt-0.5 text-warning">
                                    هذا الدفتر مهيأ للتوزيع التلقائي التناسبى (Egg Production Cost Splitting). سيقوم النظام آلياً باحتساب نسب التوزيع لكل مشروع بناءً على أعداد وإنتاج البيض، ثم تقسيم كل معاملة يتم رفعها وحفظها موزعة بين المشاريع النشطة!
                                  </p>
                                </div>
                              </div>
                            )}

                            <div
                              onDragOver={(e) => { e.preventDefault(); setTxDragActive(true) }}
                              onDragLeave={() => setTxDragActive(false)}
                              onDrop={(e) => {
                                e.preventDefault()
                                setTxDragActive(false)
                                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                  setTxFile(e.dataTransfer.files[0])
                                }
                              }}
                              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
                                txDragActive
                                  ? 'border-action-primary bg-info-soft/10'
                                  : txFile
                                  ? 'border-success bg-success-soft/5'
                                  : 'border-line hover:border-action-primary'
                              }`}
                              onClick={() => document.getElementById('tx-file-input')?.click()}
                            >
                              <input
                                id="tx-file-input"
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setTxFile(e.target.files[0])
                                  }
                                }}
                              />
                              
                              <div className="flex flex-col items-center justify-center space-y-2">
                                <div className={`p-2.5 rounded-xl ${txFile ? 'bg-success-soft text-success' : 'bg-success-soft/10 text-success'}`}>
                                  <UploadCloud className="w-5.5 h-5.5" />
                                </div>
                                {txFile ? (
                                  <div className="space-y-1">
                                    <p className="font-bold text-ink max-w-[200px] truncate mx-auto">{txFile.name}</p>
                                    <p className="text-xs text-ink-muted">{(txFile.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <p className="font-bold text-ink-soft">اسحب وأفلت ورقة عمل قيود اليومية هنا</p>
                                    <p className="text-xs text-ink-muted font-medium">أو اضغط لتصفح الملفات من جهازك (.xlsx, .xls)</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-between gap-2.5">
                              {txFile && (
                                <button
                                  type="button"
                                  onClick={() => setTxFile(null)}
                                  disabled={importTxMutation.isPending}
                                  className="px-3.5 py-2 bg-surface-muted hover:bg-surface-subtle border border-line text-ink-muted font-bold rounded-xl transition-colors disabled:opacity-50"
                                >
                                  إلغاء
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!txFile || !activeSheetId) return
                                  setTxImportSuccess(null)
                                  setTxImportError(null)
                                  const fd = new FormData()
                                  fd.append('file', txFile)
                                  try {
                                    const res = await importTxMutation.mutateAsync(fd)
                                    setTxImportSuccess(`تم استيراد قيود المعاملات بنجاح! تم تسجيل ${res.data.inserted_transactions} قيد محاسبي موزون بنجاح من أصل ${res.data.total_rows_read} صف تم معالجته.`);
                                    setTxFile(null)
                                  } catch (err: any) {
                                    setTxImportError(err?.message || 'حدث خطأ أثناء معالجة وقراءة ملف قيود اليومية. يرجى مراجعة هيكل البيانات.')
                                  }
                                }}
                                disabled={!txFile || importTxMutation.isPending}
                                className="flex-1 py-2 bg-action-primary text-ink-inverse font-bold rounded-xl shadow-md hover:bg-opacity-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                {importTxMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>جاري معالجة وتوزيع الحركات المالية...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>بدء استيراد قيود اليومية</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Account Deletion Confirm Modal (Arabic RTL Glassmorphism) */}
      {deletingAccount && (() => {
        const descendants = getDescendants(deletingAccount)
        const hasChildren = descendants.length > 0

        return (
          <AppDialog open={!!deletingAccount} onClose={() => { setDeletingAccount(null); setDeleteError(null) }} panelClassName="max-w-lg animate-fade-in">
            <div className="flex w-full flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl" dir="rtl">
              
              {/* Header */}
              <div className={`p-6 flex items-center gap-4 ${hasChildren ? 'bg-danger-soft text-danger border-b border-danger-soft' : 'bg-warning-soft text-warning-strong border-b border-warning-soft'}`}>
                <div className={`p-3 rounded-2xl ${hasChildren ? 'bg-danger-soft' : 'bg-warning-soft'}`}>
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold font-sans">
                    {hasChildren ? 'تحذير: حذف حساب رئيسي نشط' : 'تأكيد حذف الحساب المالي'}
                  </h3>
                  <p className="text-[12px] opacity-80 mt-0.5">
                    كود الحساب: {deletingAccount.code} — {deletingAccount.name}
                  </p>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                {deleteError && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl border border-danger-soft bg-danger-soft p-4 text-danger text-sm font-semibold">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{deleteError}</span>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-warning-soft bg-warning-soft p-4">
                      <p className="text-sm text-warning-strong font-semibold leading-relaxed">
                        خيارات الحماية البديلة: يمكنك تجميد الحساب المالي لتعطيله بالكامل ومنع أي قيود يومية جديدة عليه وعلى كافة حساباته الفرعية مع الاحتفاظ بكافة سجلاته المالية التاريخية.
                      </p>
                      <button
                        type="button"
                        disabled={toggleAccountStatusMutation.isPending}
                        onClick={async () => {
                          try {
                            await toggleAccountStatusMutation.mutateAsync({ id: deletingAccount.id, isActive: false })
                            setDeletingAccount(null)
                            setDeleteError(null)
                          } catch (err: any) {
                            setDeleteError(err?.message || 'تعذر تجميد الحساب المالي.')
                          }
                        }}
                        className="w-full py-2.5 bg-warning hover:bg-warning-strong text-ink-inverse font-bold rounded-xl text-[12px] flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer hover:scale-[1.01]"
                      >
                        {toggleAccountStatusMutation.isPending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>جاري تجميد الحساب وحساباته الفرعية...</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5" />
                            <span>تجميد وتعطيل الحساب وحساباته التابعة 🔒</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {hasChildren ? (
                  <div className="space-y-3">
                    <p className="text-ink-soft text-sm leading-relaxed font-medium">
                      تنبيه هام: هذا الحساب رئيسي ويحتوي على <span className="text-danger text-danger font-extrabold">{descendants.length}</span> حساب فرعي تابعة له في شجرة الحسابات. 
                      <span className="font-bold text-danger text-danger block mt-1">تأكيد الحذف سيقوم بحذف هذا الحساب الرئيسي وكافة حساباته الفرعية التالية نهائياً:</span>
                    </p>
                    <div className="bg-surface-raised rounded-2xl p-4 border border-line max-h-48 overflow-y-auto space-y-2">
                      {descendants.map((child: any) => (
                        <div key={child.id} className="flex items-center justify-between text-xs text-ink-soft bg-surface p-2 rounded-xl border border-line">
                          <span className="font-bold font-mono text-ink-muted">{child.code}</span>
                          <span className="font-semibold">{child.name}</span>
                          <span className="text-xs text-ink-muted px-1.5 py-0.5 bg-surface-muted rounded-md">
                            {child.type === 'asset' ? 'أصول' : child.type === 'liability' ? 'خصوم' : child.type === 'equity' ? 'حقوق ملكية' : child.type === 'revenue' ? 'إيرادات' : 'مصروفات'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-ink-muted italic leading-relaxed">
                      * لن يتم الحذف في حال وجود أي حركات يومية مقيدة تحت هذا الحساب أو أي من حساباته التابعة حفاظاً على سلامة البيانات.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-ink-soft text-sm leading-relaxed">
                    <p className="font-semibold">
                      هل أنت متأكد من رغبتك في حذف هذا الحساب المالي نهائياً من شجرة دليل الحسابات؟
                    </p>
                    <div className="flex items-start gap-2.5 rounded-2xl border border-warning-soft bg-warning-soft/40 p-3.5 text-sm font-semibold text-warning-strong">
                      <Info className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>ملاحظة: هذا الإجراء نهائي ولا يمكن التراجع عنه. لن يتمكن النظام من إتمام الحذف إذا كان الحساب مرتبطاً بقيود يومية أو حركات حسابات نشطة.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-surface-muted bg-surface-raised border-t border-line flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingAccount(null)
                    setDeleteError(null)
                  }}
                  disabled={deleteAccountMutation.isPending}
                  className="px-4 py-2.5 bg-surface hover:bg-surface-muted border border-line text-ink-soft font-bold rounded-xl transition-colors disabled:opacity-50 text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setDeleteError(null)
                    try {
                      await deleteAccountMutation.mutateAsync(deletingAccount.id)
                      setDeletingAccount(null)
                    } catch (err: any) {
                      setDeleteError(err?.message || 'تعذر حذف الحساب المالي. يرجى التحقق من عدم وجود حركات يومية مقيدة به.')
                    }
                  }}
                  disabled={deleteAccountMutation.isPending}
                  className="px-5 py-2.5 bg-danger text-ink-inverse hover:bg-danger font-bold rounded-xl shadow-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  {deleteAccountMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الحذف والتحقق...</span>
                    </>
                  ) : (
                    <span>تأكيد الحذف النهائي</span>
                  )}
                </button>
              </div>

            </div>
          </AppDialog>
        )
      })()}
    </div>
  )
}
