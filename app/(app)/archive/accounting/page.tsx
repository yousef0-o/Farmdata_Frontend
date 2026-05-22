'use client'

import React, { useState } from 'react'
import {
  useAccountingAccounts,
  useCreateAccountingAccount,
  useRecordSheets,
  useCreateRecordSheet,
  useRecordSheet,
  useCloseRecordSheet,
  useCreateTransaction,
  useAnnualAccountingStats
} from '@/lib/hooks/useArchive'
import {
  BookOpen,
  Plus,
  Coins,
  Receipt,
  UserCheck,
  Calendar,
  AlertCircle,
  Loader2,
  ListFilter,
  CheckCircle,
  FolderOpen
} from 'lucide-react'

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'accounts' | 'sheets'>('matrix')
  const [selectedYear, setSelectedYear] = useState<number>(2026)

  // Accounts Queries/Mutations
  const { data: accountsRes, isLoading: loadingAccounts } = useAccountingAccounts()
  const createAccountMutation = useCreateAccountingAccount()

  const [newAccCode, setNewAccCode] = useState('')
  const [newAccName, setNewAccName] = useState('')
  const [newAccType, setNewAccType] = useState<'asset' | 'liability' | 'equity' | 'revenue' | 'expense'>('asset')
  const [newAccParentId, setNewAccParentId] = useState<number | null>(null)
  const [accError, setAccError] = useState('')

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

  // Annual matrix stats query
  const { data: matrixRes, isLoading: loadingMatrix } = useAnnualAccountingStats(selectedYear)

  const accounts = accountsRes?.data ?? []
  const sheets = sheetsRes?.data ?? []
  const currentSheet = sheetDetailRes?.data
  const matrixData = matrixRes?.data ?? []

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

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#ffffff] dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-farm-blue text-[#ffffff] rounded-2xl shadow-sm">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-[#ffffff] font-sans">الدفاتر اليومية والحسابات المحاسبية</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">التقارير السنوية المتقاطعة، دليل الحسابات الشجري، والتسجيل المزدوج للقيود</p>
          </div>
        </div>

        {/* Tab triggers */}
        <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-150 dark:border-gray-800 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'matrix' ? 'bg-[#ffffff] dark:bg-gray-900 text-farm-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            الجدول السنوي
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'accounts' ? 'bg-[#ffffff] dark:bg-gray-900 text-farm-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            دليل الحسابات
          </button>
          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'sheets' ? 'bg-[#ffffff] dark:bg-gray-900 text-farm-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            الدفاتر والسجلات
          </button>
        </div>
      </div>

      {/* MATRIX TAB CONTENT */}
      {activeTab === 'matrix' && (
        <div className="bg-[#ffffff] dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-[#ffffff] font-sans">المصفوفة المحاسبية السنوية للأرباح والمصروفات</h3>
              <p className="text-[11px] text-gray-400 mt-1">الرصد الشهري المتكامل للتدفقات المحاسبية لعام {selectedYear}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-semibold">تصفية السنة:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="p-2 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-xs font-bold rounded-lg dark:text-[#ffffff]"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>
          </div>

          {loadingMatrix ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
              <span className="text-gray-400 text-xs mt-3">جاري توليد المصفوفة المحاسبية...</span>
            </div>
          ) : matrixData.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-xs font-semibold">
              لا توجد حركة قيود أو دفاتر محاسبية مقيدة لعام {selectedYear} حتى الآن.
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-50 dark:border-gray-800 rounded-xl">
              <table className="w-full text-right border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-850 text-gray-500 font-bold">
                    <th className="p-3 font-sans w-48 sticky right-0 bg-gray-50 dark:bg-gray-900 border-l border-gray-100 dark:border-gray-850">كود واسم الحساب</th>
                    {months.map((m) => (
                      <th key={m.num} className="p-3 font-sans text-center min-w-[70px]">{m.name}</th>
                    ))}
                    <th className="p-3 font-sans text-center bg-gray-100 dark:bg-gray-800 w-24">إجمالي السنوي</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixData.map((row: any) => {
                    let totalVal = 0
                    return (
                      <tr key={row.account_id} className="border-b border-gray-50 dark:border-gray-850 hover:bg-gray-50/50">
                        <td className="p-3 font-bold text-gray-800 dark:text-gray-200 sticky right-0 bg-[#ffffff] dark:bg-gray-900 border-l border-gray-100 dark:border-gray-850">
                          {row.account_code} - {row.account_name}
                        </td>
                        {months.map((m) => {
                          const val = row.months?.[m.num] ?? 0
                          totalVal += val
                          return (
                            <td key={m.num} className={`p-3 text-center font-medium ${val > 0 ? 'text-emerald-600 font-bold' : val < 0 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                              {val !== 0 ? val.toLocaleString('ar-EG') : '-'}
                            </td>
                          )
                        })}
                        <td className={`p-3 text-center font-bold bg-gray-50/40 dark:bg-gray-800/20 ${totalVal > 0 ? 'text-emerald-600' : totalVal < 0 ? 'text-red-500' : 'text-gray-400'}`}>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Account Form */}
          <div className="bg-[#ffffff] dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm h-fit">
            <h3 className="text-sm font-bold text-gray-800 dark:text-[#ffffff] font-sans flex items-center gap-1">
              <Coins className="w-4 h-4 text-farm-blue" />
              <span>إضافة حساب محاسبي جديد</span>
            </h3>

            <form onSubmit={handleCreateAccount} className="mt-4 space-y-4 text-xs">
              {accError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-150 text-red-600 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  <span>{accError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-400 mb-1.5">كود الحساب (رقمي فريد)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 1101"
                  value={newAccCode}
                  onChange={(e) => setNewAccCode(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none dark:text-[#ffffff]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-400 mb-1.5">اسم الحساب</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: نقدية البنك الأهلي"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none dark:text-[#ffffff]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-400 mb-1.5">نوع التصنيف الرئيسي</label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none dark:text-[#ffffff]"
                >
                  <option value="asset">الأصول (Assets)</option>
                  <option value="liability">الخصوم (Liabilities)</option>
                  <option value="equity">حقوق الملكية (Equity)</option>
                  <option value="revenue">الإيرادات (Revenues)</option>
                  <option value="expense">المصروفات (Expenses)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-400 mb-1.5">الحساب الأب (إن وجد)</label>
                <select
                  value={newAccParentId ?? ''}
                  onChange={(e) => setNewAccParentId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-850 rounded-xl focus:outline-none dark:text-[#ffffff]"
                >
                  <option value="">حساب رئيسي (بدون أب)</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={createAccountMutation.isPending}
                className="w-full py-2.5 bg-farm-blue text-[#ffffff] font-bold rounded-xl shadow-md hover:bg-opacity-95 disabled:opacity-50"
              >
                {createAccountMutation.isPending ? 'جاري الحفظ...' : 'حفظ الحساب'}
              </button>
            </form>
          </div>

          {/* Accounts List Tree */}
          <div className="bg-[#ffffff] dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-[#ffffff] font-sans">دليل الحسابات المحاسبي (Chart of Accounts)</h3>
            
            {loadingAccounts ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-farm-blue" /></div>
            ) : accounts.length === 0 ? (
              <p className="text-gray-400 text-xs">لا يوجد حسابات مضافة حالياً.</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className={`p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-850 flex items-center justify-between text-xs hover:border-farm-blue transition-all ${
                      acc.parent_id ? 'mr-6 border-r-2 border-r-farm-blue/60' : 'font-bold'
                    }`}
                  >
                    <div>
                      <span className="text-gray-400 font-semibold ml-2">[{acc.code}]</span>
                      <span className="text-gray-850 dark:text-gray-200">{acc.name}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      acc.type === 'asset' ? 'bg-blue-50 text-blue-600' :
                      acc.type === 'liability' ? 'bg-red-50 text-red-600' :
                      acc.type === 'equity' ? 'bg-amber-50 text-amber-600' :
                      acc.type === 'revenue' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-purple-50 text-purple-600'
                    }`}>
                      {acc.type === 'asset' && 'أصول'}
                      {acc.type === 'liability' && 'خصوم'}
                      {acc.type === 'equity' && 'حقوق ملكية'}
                      {acc.type === 'revenue' && 'إيرادات'}
                      {acc.type === 'expense' && 'مصروفات'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHEETS TAB CONTENT */}
      {activeTab === 'sheets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Sheets List */}
          <div className="bg-[#ffffff] dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-850 pb-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-[#ffffff] font-sans flex items-center gap-1.5">
                <Receipt className="w-5 h-5 text-farm-blue" />
                <span>دفاتر السجلات المفتوحة</span>
              </h3>
              
              <select
                value={sheetFilterStatus ?? ''}
                onChange={(e) => setSheetFilterStatus(e.target.value ? e.target.value as any : undefined)}
                className="p-1 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-800 text-[10px]"
              >
                <option value="">الكل</option>
                <option value="open">مفتوح</option>
                <option value="closed">مغلق</option>
              </select>
            </div>

            {loadingSheets ? (
              <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-farm-blue" /></div>
            ) : sheets.length === 0 ? (
              <p className="text-gray-400 text-xs">لا يوجد دفاتر قيود مسجلة.</p>
            ) : (
              <div className="space-y-2">
                {sheets.map((sheet) => (
                  <div
                    key={sheet.id}
                    onClick={() => setActiveSheetId(sheet.id)}
                    className={`p-4 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl border cursor-pointer transition-all ${
                      activeSheetId === sheet.id ? 'border-farm-blue bg-blue-50/10' : 'border-gray-100 dark:border-gray-850'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-800 dark:text-[#ffffff]">{sheet.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        sheet.status === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {sheet.status === 'open' ? 'نشط ومفتوح' : 'مغلق ومؤرشف'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2">
                      <span>الحساب: {sheet.account?.name}</span>
                      <span>الفترة: {sheet.period_start}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Open Sheet Form */}
            <div className="border-t border-gray-100 dark:border-gray-850 pt-4 mt-6">
              <h4 className="text-xs font-bold text-gray-800 dark:text-[#ffffff] font-sans">فتح دفتر يومية محاسبي جديد</h4>
              <form onSubmit={handleCreateSheet} className="mt-3 space-y-3 text-xs">
                {sheetError && <p className="text-red-500 font-bold">{sheetError}</p>}
                
                <input
                  type="text"
                  required
                  placeholder="عنوان السجل (مثال: دفاتر يناير 2026)"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-850 border border-gray-250 dark:border-gray-850 rounded-lg focus:outline-none"
                />

                <select
                  required
                  value={newSheetAccountId}
                  onChange={(e) => setNewSheetAccountId(parseInt(e.target.value))}
                  className="w-full p-2 bg-gray-50 dark:bg-gray-850 border border-gray-250 dark:border-gray-850 rounded-lg focus:outline-none"
                >
                  <option value="">اختر حساب الربط...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    required
                    value={newSheetStart}
                    onChange={(e) => setNewSheetStart(e.target.value)}
                    className="w-1/2 p-2 bg-gray-50 dark:bg-gray-850 border border-gray-250 dark:border-gray-850 rounded-lg text-[10px]"
                  />
                  <input
                    type="date"
                    required
                    value={newSheetEnd}
                    onChange={(e) => setNewSheetEnd(e.target.value)}
                    className="w-1/2 p-2 bg-gray-50 dark:bg-gray-850 border border-gray-250 dark:border-gray-850 rounded-lg text-[10px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createSheetMutation.isPending}
                  className="w-full py-2 bg-farm-blue text-[#ffffff] font-bold rounded-lg hover:bg-opacity-95"
                >
                  فتح الدفتر الآن
                </button>
              </form>
            </div>
          </div>

          {/* Sheet transactions Explorer & Ledger Postings */}
          <div className="bg-[#ffffff] dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-6">
            {!activeSheetId ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-xs font-semibold">
                <FolderOpen className="w-12 h-12 text-gray-200 dark:text-gray-700" />
                <span className="mt-3">يرجى تحديد أحد دفاتر القيود النشطة من القائمة الجانبية لاستعراض قيود اليومية.</span>
              </div>
            ) : loadingSheetDetail ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-farm-blue" /></div>
            ) : !currentSheet ? (
              <p className="text-red-500 text-xs">تعذر جلب تفاصيل السجل المالي.</p>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-850 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-[#ffffff] font-sans">{currentSheet.title}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">
                      حساب السيطرة: {currentSheet.account?.name} | حالة الدفتر: {currentSheet.status === 'open' ? 'نشط' : 'مغلق ومثبت'}
                    </p>
                  </div>

                  {currentSheet.status === 'open' && (
                    <button
                      onClick={handleCloseSheet}
                      disabled={closeSheetMutation.isPending}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-[#ffffff] font-bold text-xs rounded-xl shadow transition-all"
                    >
                      إغلاق وتجميد الفترة
                    </button>
                  )}
                </div>

                {/* Transactions Ledger Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-[#ffffff] font-sans">جدول قيود اليومية المقيدة ({currentSheet.transactions?.length ?? 0})</h4>
                  <div className="overflow-x-auto border border-gray-50 dark:border-gray-850 rounded-xl text-[10px]">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-150 text-gray-500 font-bold">
                          <th className="p-3 font-sans">التاريخ</th>
                          <th className="p-3 font-sans">البيان / الوصف</th>
                          <th className="p-3 font-sans">الحساب المقابل</th>
                          <th className="p-3 font-sans text-center">مدين (+)</th>
                          <th className="p-3 font-sans text-center">دائن (-)</th>
                          <th className="p-3 font-sans">المرجع</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentSheet.transactions?.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-gray-400">لا يوجد قيود يومية مقيدة في هذا الدفتر بعد.</td>
                          </tr>
                        ) : (
                          currentSheet.transactions?.map((tx) => (
                            <tr key={tx.id} className="border-b border-gray-50 dark:border-gray-850">
                              <td className="p-3 font-medium">{tx.transaction_date}</td>
                              <td className="p-3 text-gray-700 dark:text-gray-300">{tx.description ?? '-'}</td>
                              <td className="p-3 font-bold">{tx.account?.name}</td>
                              <td className="p-3 text-center text-emerald-600 font-bold">{tx.debit > 0 ? tx.debit.toLocaleString('ar-EG') : '-'}</td>
                              <td className="p-3 text-center text-red-500 font-bold">{tx.credit > 0 ? tx.credit.toLocaleString('ar-EG') : '-'}</td>
                              <td className="p-3 text-gray-400 font-semibold">{tx.reference ?? '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Post Transaction Form */}
                {currentSheet.status === 'open' && (
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-850/40 border border-gray-150 dark:border-gray-800 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-[#ffffff] font-sans">تسجيل قيد محاسبي مزدوج (Double-Entry Post)</h4>
                    {txError && <p className="text-red-500 font-bold text-xs">{txError}</p>}
                    
                    <form onSubmit={handlePostTransaction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-semibold mb-1">الحساب المقابل</label>
                        <select
                          required
                          value={txAccountId}
                          onChange={(e) => setTxAccountId(parseInt(e.target.value))}
                          className="w-full p-2 border border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-xs"
                        >
                          <option value="">اختر حساب...</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-400 font-semibold mb-1">البيان / الوصف</label>
                        <input
                          type="text"
                          placeholder="مثال: دفعة فواتير مشتريات الأعلاف"
                          value={txDesc}
                          onChange={(e) => setTxDesc(e.target.value)}
                          className="w-full p-2 border border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-xs"
                        />
                      </div>

                      <div className="flex gap-2">
                        <div className="w-1/2">
                          <label className="block text-[10px] text-gray-400 font-semibold mb-1">مدين (+)</label>
                          <input
                            type="number"
                            step="any"
                            value={txDebit === 0 ? '' : txDebit}
                            onChange={(e) => setTxDebit(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                            className="w-full p-2 border border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-xs font-bold text-emerald-600"
                          />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-[10px] text-gray-400 font-semibold mb-1">دائن (-)</label>
                          <input
                            type="number"
                            step="any"
                            value={txCredit === 0 ? '' : txCredit}
                            onChange={(e) => setTxCredit(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                            className="w-full p-2 border border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-xs font-bold text-red-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-400 font-semibold mb-1">تاريخ القيد</label>
                        <input
                          type="date"
                          required
                          value={txDate}
                          onChange={(e) => setTxDate(e.target.value)}
                          className="w-full p-2 border border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-400 font-semibold mb-1">الرقم المرجعي / الفاتورة</label>
                        <input
                          type="text"
                          placeholder="مثال: INV-9821"
                          value={txRef}
                          onChange={(e) => setTxRef(e.target.value)}
                          className="w-full p-2 border border-gray-250 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-xs"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={createTxMutation.isPending}
                          className="w-full py-2 bg-farm-blue text-[#ffffff] font-bold rounded-lg hover:bg-opacity-95 flex items-center justify-center gap-1.5"
                        >
                          {createTxMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>ترحيل القيد</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
