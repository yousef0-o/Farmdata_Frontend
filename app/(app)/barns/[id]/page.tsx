'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Sprout, Loader2, ChevronRight, Plus, Trash2, Calendar, FileText, X, BarChart3,
  Upload, Download, MoreVertical, Edit, PowerOff, ShieldAlert
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationApi, flockApi } from '@/lib/api/organization'
import { useBarnExpenses, useCreateBarnExpense, useDeleteBarnExpense } from '@/lib/hooks/useExpenses'
import type { Flock } from '@/lib/types'
import UnifiedStatsCards from '@/components/statistics/UnifiedStatsCards'
import AnnualProductionTable from '@/components/statistics/AnnualProductionTable'
import LedgerSummaryCard from '@/components/statistics/LedgerSummaryCard'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'
import AppDialog from '@/components/ui/AppDialog'

const typeLabels: Record<string, string> = {
  production: 'إنتاج',
  breeding: 'تربية',
}

const statusLabels: Record<string, string> = {
  active: 'نشط',
  completed: 'مغلق',
  cancelled: 'ملغي',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function BarnDetailPage() {
  const { id } = useParams()
  const barnId = Number(id)
  const router = useRouter()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'flocks' | 'expenses' | 'statistics'>('flocks')
  const [flockFilter, setFlockFilter] = useState<'all' | 'active' | 'completed'>('active')
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // Form states
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('صيانة')
  const [description, setDescription] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['barn', barnId],
    queryFn: () => organizationApi.getBarn(barnId),
  })

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: ['barn-statistics', barnId],
    queryFn: () => organizationApi.getBarnStatistics(barnId),
    enabled: activeTab === 'statistics',
  })

  const deleteBarnMutation = useMutation({
    mutationFn: (id: number) => organizationApi.deleteBarn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section', barn?.section_id] })
      router.push(`/sections/${barn?.section_id}`)
    }
  })

  const { data: expensesData, isLoading: isExpensesLoading } = useBarnExpenses(barnId)
  const createExpenseMutation = useCreateBarnExpense(barnId)
  const deleteExpenseMutation = useDeleteBarnExpense(barnId)

  const barn = data?.data
  const stats = statsRes

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (!barn) {
    return (
      <div className="text-center py-20 text-gray-500">العنبر غير موجود.</div>
    )
  }

  // Use all flocks if available, fallback to active_flocks for backward compatibility
  const allFlocks: Flock[] = barn.flocks || barn.active_flocks || []
  
  const filteredFlocks = allFlocks.filter(f => {
    if (flockFilter === 'all') return true
    if (flockFilter === 'active') return f.status === 'active' || !f.status
    if (flockFilter === 'completed') return f.status === 'completed'
    return true
  })

  const expenses = expensesData?.data ?? []

  const backHref = barn.section_id
    ? `/sections/${barn.section_id}`
    : '/companies'

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!amount || Number(amount) <= 0) {
      setErrorMsg('يرجى إدخال مبلغ صحيح')
      return
    }

    try {
      await createExpenseMutation.mutateAsync({
        expense_date: expenseDate,
        amount: Number(amount),
        category,
        description,
      })
      setShowAddModal(false)
      setAmount('')
      setDescription('')
      setExpenseDate(new Date().toISOString().split('T')[0])
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل في حفظ المصروف')
    }
  }

  const handleDeleteBarn = async () => {
    if (confirm('هل أنت متأكد من حذف هذه الحظيرة نهائياً؟ هذا الإجراء سيحذف كافة الأفواج والبيانات المرتبطة بها ولن يمكن التراجع عنه.')) {
      deleteBarnMutation.mutate(barnId)
    }
  }

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setImportError('')
    if (!importFile) {
      setImportError('الرجاء اختيار ملف إكسل')
      return
    }

    setIsImporting(true)
    try {
      await flockApi.importFlocks(barnId, importFile)
      queryClient.invalidateQueries({ queryKey: ['barn', barnId] })
      setShowImportModal(false)
      setImportFile(null)
    } catch (err: any) {
      setImportError(err.message || 'فشل في استيراد الملف')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDeleteFlock = async (flockId: number) => {
    if (confirm('هل أنت متأكد من حذف هذا القطيع؟')) {
      try {
        await flockApi.deleteFlock(flockId)
        queryClient.invalidateQueries({ queryKey: ['barn', barnId] })
      } catch (err) {
        alert('حدث خطأ أثناء الحذف')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col gap-2 flex-1">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <Link href="/companies" className="hover:text-farm-blue transition-colors">الشركات</Link>
            <ChevronRight className="w-4 h-4 opacity-50" />
            {barn.section?.project?.company && (
              <>
                <span className="text-gray-600">{barn.section.project.company.name}</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </>
            )}
            {barn.section?.project && (
              <>
                <Link href={`/projects/${barn.section.project.id}`} className="hover:text-farm-blue transition-colors">
                  {barn.section.project.project_name}
                </Link>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </>
            )}
            {barn.section && (
              <>
                <Link href={`/sections/${barn.section.id}`} className="hover:text-farm-blue transition-colors">
                  {barn.section.section_name}
                </Link>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </>
            )}
            <span className="font-semibold text-gray-900">{barn.barn_name}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${barn.barn_type === 'production' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{barn.barn_name}</h1>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${barn.barn_type === 'production' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {typeLabels[barn.barn_type]}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {barn.capacity ? `السعة الاستيعابية: ${barn.capacity.toLocaleString()} طير` : 'السعة غير محددة'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 shrink-0">
          <button 
            onClick={handleDeleteBarn}
            disabled={deleteBarnMutation.isPending}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl transition-colors font-medium border border-red-200"
          >
            {deleteBarnMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span className="hidden sm:inline">حذف الحظيرة</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex overflow-x-auto border-b-2 border-slate-300 hide-scrollbar">
        <button
          onClick={() => setActiveTab('flocks')}
          className={`pb-4 px-6 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'flocks'
              ? 'border-farm-green text-farm-green'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          القطعان ({allFlocks.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-4 px-6 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'border-farm-green text-farm-green'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          سجل مصروفات الحظيرة
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={`pb-4 px-6 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'statistics'
              ? 'border-farm-green text-farm-green'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>التقرير الإحصائي والمالي للحظيرة</span>
        </button>
      </div>

      {/* Flocks Tab Content */}
      {activeTab === 'flocks' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            {/* Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setFlockFilter('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${flockFilter === 'all' ? 'bg-farm-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                الكل
              </button>
              <button
                onClick={() => setFlockFilter('active')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${flockFilter === 'active' ? 'bg-farm-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                النشطة
              </button>
              <button
                onClick={() => setFlockFilter('completed')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${flockFilter === 'completed' ? 'bg-farm-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                المغلقة
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition-colors font-medium border border-slate-200 text-sm"
              >
                <Upload className="w-4 h-4" />
                <span>استيراد أفواج</span>
              </button>
              <Link
                href={`/flocks/new?barn_id=${barnId}`}
                className="flex items-center gap-2 bg-farm-green hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قطيع</span>
              </Link>
            </div>
          </div>

          {filteredFlocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <Sprout className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600">
                لا توجد قطعان {flockFilter === 'active' ? 'نشطة' : flockFilter === 'completed' ? 'مغلقة' : ''}
              </h3>
              <p className="text-gray-500 mt-2">قم بإضافة أو استيراد قطيع جديد للبدء.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredFlocks.map((flock) => (
                <div key={flock.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col relative overflow-hidden">
                  {/* Status Indicator Bar */}
                  <div className={`h-1 w-full absolute top-0 left-0 ${flock.status === 'active' || !flock.status ? 'bg-green-500' : flock.status === 'completed' ? 'bg-gray-400' : 'bg-red-500'}`}></div>
                  
                  <div className="p-5 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[flock.status] ?? 'bg-green-100 text-green-700'}`}>
                          {statusLabels[flock.status] ?? 'نشط'}
                        </span>
                      </div>
                      
                      {/* Quick Actions Dropdown */}
                      <details className="relative">
                        <summary className="list-none cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </summary>
                        <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-10 animate-in fade-in zoom-in-95 duration-100">
                          <Link href={`/flocks/${flock.id}/edit`} className="flex items-center gap-2 w-full text-right px-4 py-2.5 text-sm hover:bg-slate-50 text-slate-700">
                            <Edit className="w-4 h-4 text-slate-400" /> تعديل البيانات
                          </Link>
                          {(flock.status === 'active' || !flock.status) && (
                            <Link href={`/flocks/${flock.id}/closure`} className="flex items-center gap-2 w-full text-right px-4 py-2.5 text-sm hover:bg-orange-50 text-orange-700">
                              <PowerOff className="w-4 h-4 text-orange-400" /> إغلاق القطيع
                            </Link>
                          )}
                          <button onClick={() => handleDeleteFlock(flock.id)} className="flex items-center gap-2 w-full text-right px-4 py-2.5 text-sm hover:bg-red-50 text-red-600">
                            <Trash2 className="w-4 h-4 text-red-400" /> حذف القطيع
                          </button>
                        </div>
                      </details>
                    </div>

                    <Link href={`/flocks/${flock.id}`} className="block group-hover:bg-slate-50/50 -mx-5 px-5 py-2 rounded-lg transition-colors mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <span>قطيع رقم {flock.id}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-farm-blue" />
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>تاريخ الدخول: {new Date(flock.entry_date).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </Link>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">العدد المدخل</p>
                        <p className="text-lg font-bold text-gray-900">
                          {flock.entry_birds.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">العدد الحالي</p>
                        <p className="text-lg font-bold text-farm-blue">
                          {flock.current_count.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {flock.breed && (
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-xs text-slate-500">السلالة:</span>
                        <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{flock.breed}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expenses Tab Content */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-gray-800">مصروفات الحظيرة العامة</h2>
              <p className="text-sm text-gray-500 mt-1">تتبع التكاليف غير المرتبطة مباشرة بقطيع معين</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-farm-blue hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium text-sm"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">إضافة مصروف</span>
            </button>
          </div>

          {isExpensesLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-farm-blue animate-spin" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <SaudiRiyalIcon size={56} className="text-emerald-700 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600">لا توجد مصروفات مسجلة</h3>
              <p className="text-gray-500 mt-2">سجل أول مصروف لهذه الحظيرة الآن.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm font-semibold">
                      <th className="py-4 px-6">التاريخ</th>
                      <th className="py-4 px-6">الفئة</th>
                      <th className="py-4 px-6">المبلغ</th>
                      <th className="py-4 px-6">الوصف</th>
                      <th className="py-4 px-6 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 font-medium whitespace-nowrap">
                          {new Date(exp.expense_date).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-900">
                          {Number(exp.amount).toLocaleString('ar-EG')} <SaudiRiyalIcon size={16} className="text-emerald-700 inline-block align-middle ml-1" />
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500 max-w-xs truncate">
                          {exp.description || '-'}
                        </td>
                        <td className="py-4 px-6 text-left whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
                                deleteExpenseMutation.mutate(exp.id)
                              }
                            }}
                            disabled={deleteExpenseMutation.isPending}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistics view */}
      {activeTab === 'statistics' && (
        <div className="space-y-8">
          {isStatsLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-farm-green animate-spin" />
            </div>
          ) : stats ? (
            <>
              {/* Unified Stats Cards */}
              <UnifiedStatsCards stats={stats} />

              {/* Ledger Summary */}
              <LedgerSummaryCard ledger={stats.ledger_summary} />

              {/* Annual Production */}
              <AnnualProductionTable data={stats.annual_production} />
            </>
          ) : (
            <div className="text-center py-10 text-slate-500">فشل في تحميل التقارير الإحصائية للحظيرة.</div>
          )}
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddModal && (
        <AppDialog open={showAddModal} onClose={() => setShowAddModal(false)} panelClassName="max-w-md animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-full space-y-6 rounded-3xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
                <SaudiRiyalIcon size={24} className="text-emerald-700" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">إضافة مصروف حظيرة</h3>
                <p className="text-xs text-gray-500">سيتم تدوينه في السجل المالي للحظيرة</p>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">التاريخ</label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-gray-400 absolute right-3 top-3" />
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-blue transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">المبلغ (<SaudiRiyalIcon size={14} className="text-emerald-700" />)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-blue transition-colors text-left font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">الفئة</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-blue transition-colors font-semibold"
                >
                  <option value="صيانة">صيانة</option>
                  <option value="كهرباء">كهرباء</option>
                  <option value="مياه">مياه</option>
                  <option value="تعقيم وتجهيز">تعقيم وتجهيز</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">الوصف والتفاصيل</label>
                <div className="relative">
                  <FileText className="w-5 h-5 text-gray-400 absolute right-3 top-3" />
                  <textarea
                    rows={3}
                    placeholder="اكتب تفاصيل المصروف هنا..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-blue transition-colors text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="flex-1 bg-farm-blue hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {createExpenseMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>حفظ المصروف</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </AppDialog>
      )}

      {/* Import Flocks Modal */}
      {showImportModal && (
        <AppDialog open={showImportModal} onClose={() => setShowImportModal(false)} panelClassName="max-w-md animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-full space-y-6 rounded-3xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowImportModal(false)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-farm-blue rounded-2xl border border-blue-100">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">استيراد قطعان</h3>
                <p className="text-xs text-gray-500">ارفع ملف إكسل يحتوي على بيانات القطعان</p>
              </div>
            </div>

            {importError && (
              <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl font-medium flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                {importError}
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="flock-import-file"
                />
                <label htmlFor="flock-import-file" className="cursor-pointer flex flex-col items-center gap-3">
                  <FileText className="w-10 h-10 text-gray-400" />
                  <span className="text-sm font-semibold text-farm-blue hover:text-blue-700">اختر ملف إكسل (.xlsx, .csv)</span>
                  {importFile && (
                    <span className="text-xs text-green-600 font-medium">تم اختيار: {importFile.name}</span>
                  )}
                </label>
              </div>

              <div className="flex justify-center mt-2">
                <a href="#" className="text-xs text-gray-500 hover:text-farm-blue flex items-center gap-1 underline">
                  <Download className="w-3.5 h-3.5" />
                  تحميل النموذج المعتمد
                </a>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !importFile}
                  className="flex-1 bg-farm-blue hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>استيراد</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </AppDialog>
      )}
    </div>
  )
}
