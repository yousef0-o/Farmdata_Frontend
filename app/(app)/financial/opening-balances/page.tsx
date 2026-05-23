'use client'

import React, { useState, useEffect } from 'react'
import { 
  useAccountingAccounts, 
} from '@/lib/hooks/useArchive'
import { 
  useOpeningBalances, 
  useSaveOpeningBalances, 
  useImportOpeningBalances 
} from '@/lib/hooks/useOpeningBalances'
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Calendar, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  ArrowLeftRight 
} from 'lucide-react'

interface LocalLine {
  account_id: number
  debit_amount: number
  credit_amount: number
  description: string
}

export default function OpeningBalancesPage() {
  const [balanceDate, setBalanceDate] = useState('2026-01-01')
  const [description, setDescription] = useState('الأرصدة الافتتاحية للعام المالي 2026')
  const [localLines, setLocalLines] = useState<Record<number, LocalLine>>({})
  const [isDragOver, setIsDragOver] = useState(false)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Fetch all accounts from chart of accounts
  const { data: accountsRes, isLoading: isLoadingAccounts } = useAccountingAccounts()
  const accounts = accountsRes?.data ?? []

  // Fetch opening balances for active date
  const { data: balancesRes, isLoading: isLoadingBalances, refetch: refetchBalances } = useOpeningBalances(balanceDate)

  const saveMutation = useSaveOpeningBalances()
  const importMutation = useImportOpeningBalances()

  // Initialize/sync local lines from fetched balances
  useEffect(() => {
    if (balancesRes?.data) {
      const initialLines: Record<number, LocalLine> = {}
      // Set values for fetched records
      balancesRes.data.forEach((rec) => {
        initialLines[rec.account_id] = {
          account_id: rec.account_id,
          debit_amount: rec.debit_amount,
          credit_amount: rec.credit_amount,
          description: rec.description ?? '',
        }
      })
      setLocalLines(initialLines)
    } else {
      setLocalLines({})
    }
    setImportErrors([])
    setSaveSuccess(null)
    setSaveError(null)
  }, [balancesRes, balanceDate])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBalanceDate(e.target.value)
  }

  // Calculate totals
  const totalDebits = accounts.reduce((sum, account) => {
    if (!account.is_leaf) return sum
    return sum + (localLines[account.id]?.debit_amount ?? 0)
  }, 0)

  const totalCredits = accounts.reduce((sum, account) => {
    if (!account.is_leaf) return sum
    return sum + (localLines[account.id]?.credit_amount ?? 0)
  }, 0)

  const difference = Math.abs(totalDebits - totalCredits)
  const isBalanced = difference < 0.0001

  // Handle cell value change
  const handleAmountChange = (accountId: number, field: 'debit_amount' | 'credit_amount', valStr: string) => {
    // Sanitize input: allow only positive numbers
    const sanitized = valStr.replace(/[^\d.]/g, '')
    const num = parseFloat(sanitized) || 0

    setLocalLines((prev) => {
      const current = prev[accountId] ?? {
        account_id: accountId,
        debit_amount: 0,
        credit_amount: 0,
        description: '',
      }

      // Respect mutually exclusive double entry rule: if debit is set, credit should be 0, and vice versa
      const updated = { ...current }
      if (field === 'debit_amount') {
        updated.debit_amount = num
        if (num > 0) updated.credit_amount = 0
      } else {
        updated.credit_amount = num
        if (num > 0) updated.debit_amount = 0
      }

      return {
        ...prev,
        [accountId]: updated,
      }
    })
  }

  // Handle description notes change
  const handleDescriptionChange = (accountId: number, val: string) => {
    setLocalLines((prev) => {
      const current = prev[accountId] ?? {
        account_id: accountId,
        debit_amount: 0,
        credit_amount: 0,
        description: '',
      }
      return {
        ...prev,
        [accountId]: {
          ...current,
          description: val,
        },
      }
    })
  }

  // Save manual edits
  const handleSave = async () => {
    setSaveSuccess(null)
    setSaveError(null)
    setImportErrors([])

    // Compile active lines (lines with non-zero debit or credit)
    const linesPayload = Object.values(localLines).filter(
      (line) => line.debit_amount > 0 || line.credit_amount > 0
    )

    try {
      await saveMutation.mutateAsync({
        balance_date: balanceDate,
        description: description,
        lines: linesPayload,
      })
      setSaveSuccess('تم حفظ الأرصدة الافتتاحية بنجاح.')
      refetchBalances()
    } catch (err: any) {
      const messages = err?.errors?.lines ?? [err?.message ?? 'فشل حفظ الأرصدة الافتتاحية.']
      setSaveError(messages.join('\n'))
    }
  }

  // Excel file upload import
  const handleFileUpload = async (file: File) => {
    setSaveSuccess(null)
    setSaveError(null)
    setImportErrors([])

    const formData = new FormData()
    formData.append('file', file)
    formData.append('balance_date', balanceDate)
    formData.append('description', description)

    try {
      const res = await importMutation.mutateAsync(formData)
      setSaveSuccess(`تم استيراد الأرصدة الافتتاحية من الإكسيل بنجاح. (تم إدراج ${res?.data?.inserted_records ?? 0} سجل)`)
      refetchBalances()
    } catch (err: any) {
      if (err?.errors?.file) {
        setImportErrors(err.errors.file)
      } else {
        setSaveError(err?.message ?? 'فشل استيراد الملف.')
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  // Render indentations based on code depth
  const getAccountDepth = (code: string) => {
    if (code.includes('.')) {
      return code.split('.').length - 1
    }
    // Nested logic for pure digits (e.g. 1000 has length 4, 100 has length 3, etc.)
    const clean = code.replace(/[^0-9]/g, '')
    if (clean.length <= 1) return 0
    if (clean.length === 3) return 1
    if (clean.length === 6) return 2
    if (clean.length >= 9) return 3
    return Math.max(0, Math.floor((clean.length - 1) / 3))
  }

  const isLoading = isLoadingAccounts || isLoadingBalances

  return (
    <div className="container mx-auto px-6 py-8" dir="rtl">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ArrowLeftRight className="w-8 h-8 text-farm-blue" />
            الأرصدة الافتتاحية (Opening Balances)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            إدخال وتعديل الأرصدة الافتتاحية للحسابات المالية وتأكيد توازن القيود.
          </p>
        </div>
      </div>

      {/* Control Panel: Date and Description */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-farm-blue" />
            خيارات الفترة والبيان
          </h2>
          <div>
            <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">
              تاريخ الأرصدة الافتتاحية
            </label>
            <input
              type="date"
              value={balanceDate}
              onChange={handleDateChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-farm-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">
              الوصف / البيان العام
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: الأرصدة الافتتاحية للعام المالي الجديد..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-farm-blue resize-none"
            />
          </div>
        </div>

        {/* Drag and Drop Excel Area */}
        <div className="lg:col-span-2">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border-2 border-dashed p-6 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-300 relative overflow-hidden ${
              isDragOver
                ? 'border-farm-blue bg-farm-blue/5'
                : 'border-gray-200 dark:border-slate-800'
            }`}
          >
            {importMutation.isPending && (
              <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <Loader2 className="w-12 h-12 text-farm-blue animate-spin mb-3" />
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  جاري استيراد وتحليل ملف الإكسيل...
                </p>
              </div>
            )}
            
            <UploadCloud className="w-12 h-12 text-farm-blue mb-3" />
            <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-1">
              استيراد الأرصدة الافتتاحية من ملف Excel
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-4">
              اسحب وأسقط ملف الإكسيل هنا أو اضغط للتصفح. سيتم مطابقة الأعمدة تلقائياً (رمز الحساب، مدين، دائن، الوصف).
            </p>
            <label className="px-5 py-2.5 bg-farm-blue hover:bg-farm-blue-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              اختر ملف Excel
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Notifications and Errors */}
      {saveSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/55 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
            {saveSuccess}
          </p>
        </div>
      )}

      {saveError && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/55 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-800 dark:text-rose-300 font-medium whitespace-pre-line">
            {saveError}
          </div>
        </div>
      )}

      {importErrors.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/55 rounded-2xl p-6 mb-6">
          <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            فشل استيراد الملف - أخطاء التحقق من البيانات:
          </h4>
          <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
            {importErrors.map((err, idx) => (
              <li key={idx} className="text-xs text-rose-700 dark:text-rose-400 list-disc list-inside">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Grid Spreadsheet */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            شجرة الحسابات وإدخال الأرصدة
          </h2>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || isLoading}
            className="px-5 py-2.5 bg-farm-blue hover:bg-farm-blue-dark disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            حفظ الأرصدة الافتتاحية
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-800/40 text-gray-400 dark:text-gray-500 text-xs font-bold border-b border-gray-100 dark:border-slate-800">
                <th className="px-6 py-4 text-right w-1/4">رمز الحساب</th>
                <th className="px-6 py-4 text-right w-1/3">اسم الحساب</th>
                <th className="px-6 py-4 text-right w-36">النوع</th>
                <th className="px-6 py-4 text-center w-40">مدين (Debit)</th>
                <th className="px-6 py-4 text-center w-40">دائن (Credit)</th>
                <th className="px-6 py-4 text-right">الوصف / البيان الخاص</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-farm-blue animate-spin" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        جاري تحميل شجرة الحسابات والأرصدة...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    لا توجد حسابات مالية مضافة. يرجى تهيئة دليل الحسابات أولاً.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => {
                  const depth = getAccountDepth(account.code)
                  const isLeaf = account.is_leaf
                  const line = localLines[account.id] ?? {
                    debit_amount: 0,
                    credit_amount: 0,
                    description: '',
                  }

                  return (
                    <tr
                      key={account.id}
                      className={`border-b border-gray-50 dark:border-slate-800/50 text-sm transition-all duration-150 hover:bg-gray-50/20 dark:hover:bg-slate-800/20 ${
                        !isLeaf ? 'bg-gray-50/20 dark:bg-slate-800/10 font-medium' : ''
                      }`}
                    >
                      {/* Code */}
                      <td className="px-6 py-3.5 text-gray-500 dark:text-gray-400 font-mono text-xs">
                        <span style={{ paddingRight: `${depth * 1.25}rem` }} className="inline-block">
                          {account.code}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-3.5 text-gray-900 dark:text-white">
                        <span style={{ paddingRight: `${depth * 1.25}rem` }} className="inline-block">
                          {account.name}
                        </span>
                      </td>

                      {/* Type Badge */}
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold capitalize ${
                            account.type === 'asset'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                              : account.type === 'liability'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                              : account.type === 'equity'
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400'
                              : account.type === 'revenue'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                          }`}
                        >
                          {account.type === 'asset'
                            ? 'أصول'
                            : account.type === 'liability'
                            ? 'خصوم'
                            : account.type === 'equity'
                            ? 'حقوق ملكية'
                            : account.type === 'revenue'
                            ? 'إيرادات'
                            : 'مصروفات'}
                        </span>
                      </td>

                      {/* Debit Input */}
                      <td className="px-6 py-3.5 text-center">
                        {isLeaf ? (
                          <input
                            type="text"
                            value={line.debit_amount === 0 ? '' : line.debit_amount}
                            onChange={(e) => handleAmountChange(account.id, 'debit_amount', e.target.value)}
                            placeholder="0.00"
                            className="w-full text-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-farm-blue"
                          />
                        ) : (
                          <span className="text-gray-300 dark:text-slate-700 font-mono text-xs">-</span>
                        )}
                      </td>

                      {/* Credit Input */}
                      <td className="px-6 py-3.5 text-center">
                        {isLeaf ? (
                          <input
                            type="text"
                            value={line.credit_amount === 0 ? '' : line.credit_amount}
                            onChange={(e) => handleAmountChange(account.id, 'credit_amount', e.target.value)}
                            placeholder="0.00"
                            className="w-full text-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-farm-blue"
                          />
                        ) : (
                          <span className="text-gray-300 dark:text-slate-700 font-mono text-xs">-</span>
                        )}
                      </td>

                      {/* Description Input */}
                      <td className="px-6 py-3.5">
                        {isLeaf ? (
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => handleDescriptionChange(account.id, e.target.value)}
                            placeholder="ملاحظات الحساب..."
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-farm-blue"
                          />
                        ) : (
                          <span className="text-gray-300 dark:text-slate-700 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating live summary calculations */}
      <div className="sticky bottom-6 left-6 right-6 bg-white/70 dark:bg-slate-950/70 backdrop-blur-lg border border-gray-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 z-40 transition-all duration-300">
        <div className="flex flex-wrap items-center gap-8 justify-center md:justify-start">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1">إجمالي المدين (Debits)</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
              {totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="w-px h-10 bg-gray-200 dark:bg-slate-800 hidden sm:block"></div>

          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1">إجمالي الدائن (Credits)</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
              {totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="w-px h-10 bg-gray-200 dark:bg-slate-800 hidden sm:block"></div>

          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1">الفرق (Difference)</span>
            <span className={`text-2xl font-bold font-mono ${difference > 0 ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>
              {difference.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isBalanced ? (
            <span className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              متزن (Balanced)
            </span>
          ) : (
            <span className="px-5 py-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 rounded-xl text-sm font-bold border border-rose-200 dark:border-rose-900/40 flex items-center gap-2 animate-pulse">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              غير متزن (Unbalanced)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
