'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Loader2, BarChart3, TrendingUp, TrendingDown, Stethoscope, DollarSign, Plus, Trash2, Calendar, FileText, X } from 'lucide-react'
import { useFlock, useFlockSummary } from '@/lib/hooks/useFlock'
import { useFlockExpenses, useCreateFlockExpense, useDeleteFlockExpense } from '@/lib/hooks/useExpenses'
import { FlockStatusBadge } from '@/components/flock/FlockStatusBadge'
import { FlockTypeBadge } from '@/components/flock/FlockTypeBadge'
import CloseFlockDialog from '@/components/flock/CloseFlockDialog'
import ProductionEntriesTable from '@/components/daily/ProductionEntriesTable'
import BreedingEntriesTable from '@/components/daily/BreedingEntriesTable'
import MedicalRecordsTable from '@/components/medical/MedicalRecordsTable'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'
import AppDialog from '@/components/ui/AppDialog'

export default function FlockDetailPage() {
  const { id } = useParams()
  const flockId = Number(id)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'daily' | 'medical' | 'expenses'>('daily')
  const [showAddModal, setShowAddModal] = useState(false)

  // Form states
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('خدمات تشغيلية')
  const [description, setDescription] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { data: flockData, isLoading: flockLoading } = useFlock(flockId)
  const { data: summary, isLoading: summaryLoading } = useFlockSummary(flockId)
  const { data: expensesData, isLoading: isExpensesLoading } = useFlockExpenses(flockId)

  const createExpenseMutation = useCreateFlockExpense(flockId)
  const deleteExpenseMutation = useDeleteFlockExpense(flockId)

  const flock = flockData?.data
  const isProduction = flock?.flock_type === 'production'
  const isLoading = flockLoading || summaryLoading
  const expenses = expensesData?.data ?? []

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (!flock) {
    return (
      <div className="text-center py-20 text-gray-500">الفوج غير موجود.</div>
    )
  }

  const barn = flock.barn
  const section = barn?.section

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

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/companies" className="hover:text-gray-700">
            الشركات
          </Link>
          {section && (
            <>
              <span>/</span>
              <Link href={`/projects/${section.project_id}`} className="hover:text-gray-700">
                المشروع
              </Link>
              <span>/</span>
              <Link href={`/sections/${section.id}`} className="hover:text-gray-700">
                {section.section_name}
              </Link>
            </>
          )}
          {barn && (
            <>
              <span>/</span>
              <Link href={`/barns/${barn.id}`} className="hover:text-gray-700">
                {barn.barn_name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900 font-medium">
            {isProduction ? 'فوج إنتاج' : 'فوج تربية'} #{flockId}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {isProduction ? 'فوج إنتاج' : 'فوج تربية'}
          </h1>
          <FlockStatusBadge status={flock.status} />
          <FlockTypeBadge type={flock.flock_type} />
        </div>

        <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
          <span>تاريخ الدخول: {flock.entry_date}</span>
          <span>العدد المدخل: {flock.entry_birds.toLocaleString()}</span>
          <span>العدد الحالي: {flock.current_count.toLocaleString()}</span>
          {flock.breed && <span>السلالة: {flock.breed}</span>}
          {flock.supplier && <span>المورد: {flock.supplier}</span>}
        </div>
      </div>

      {/* KPI Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard
            label="العدد المدخل"
            value={summary.entry_birds.toLocaleString()}
          />
          <KpiCard
            label="العدد الحالي"
            value={summary.current_count.toLocaleString()}
          />
          <KpiCard
            label="إجمالي العلف (كجم)"
            value={summary.total_feed_kg.toLocaleString(undefined, {
              minimumFractionDigits: 1,
            })}
          />
          <KpiCard
            label="معدل النفوق (%)"
            value={`${summary.mortality_rate}%`}
            icon={
              summary.mortality_rate > 5 ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )
            }
          />
          <KpiCard label="أيام التسجيل" value={String(summary.days_recorded)} />

          {isProduction && summary.total_eggs !== undefined && (
            <>
              <KpiCard
                label="إجمالي البيض"
                value={summary.total_eggs.toLocaleString()}
              />
              <KpiCard
                label="معدل الإنتاج (%)"
                value={`${summary.average_production_rate}%`}
              />
              <KpiCard
                label="FCR"
                value={summary.fcr !== null && summary.fcr !== undefined ? summary.fcr.toFixed(3) : '—'}
              />
            </>
          )}

          {!isProduction && summary.latest_week_number !== undefined && (
            <KpiCard
              label="الأسبوع الحالي"
              value={String(summary.latest_week_number)}
            />
          )}
        </div>
      )}

      {/* Action Buttons — only for active flocks */}
      {flock.status === 'active' && (
        <div className="flex gap-3 flex-wrap">
          <Link
            href={`/flocks/${flockId}/daily/new`}
            className="flex items-center gap-2 bg-farm-green hover:bg-green-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium"
          >
            <BarChart3 className="w-5 h-5" />
            تسجيل يومي
          </Link>
          <Link
            href={`/flocks/${flockId}/medical/new`}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium shadow-sm"
          >
            <Stethoscope className="w-5 h-5" />
            فحص وصرف أدوية
          </Link>
          <button
            onClick={() => setShowCloseDialog(true)}
            className="flex items-center gap-2 bg-farm-blue hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl transition-colors font-medium"
          >
            إغلاق الفوج
          </button>
          <Link
            href={`/flocks/${flockId}/edit`}
            className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl transition-colors font-medium"
          >
            تعديل بيانات الفوج
          </Link>
        </div>
      )}

      {/* Records & Logs Switcher */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex border-b border-gray-100 pb-2 gap-6">
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-3 text-base font-bold transition-colors relative ${
              activeTab === 'daily'
                ? 'text-gray-900 border-b-2 border-farm-green'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            السجلات اليومية
          </button>
          <button
            onClick={() => setActiveTab('medical')}
            className={`pb-3 text-base font-bold transition-colors relative ${
              activeTab === 'medical'
                ? 'text-gray-900 border-b-2 border-red-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            السجل الطبي والبيطري للقطيع
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-3 text-base font-bold transition-colors relative ${
              activeTab === 'expenses'
                ? 'text-gray-900 border-b-2 border-farm-blue'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            المصروفات النثرية والتشغيلية
          </button>
        </div>

        {activeTab === 'daily' && (
          <div>
            {isProduction ? (
              <ProductionEntriesTable flockId={flockId} isActive={flock.status === 'active'} />
            ) : (
              <BreedingEntriesTable flockId={flockId} isActive={flock.status === 'active'} />
            )}
          </div>
        )}

        {activeTab === 'medical' && (
          <MedicalRecordsTable flockId={flockId} isActive={flock.status === 'active'} />
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-850">المصروفات النثرية والتشغيلية للفوج</h2>
                <p className="text-sm text-gray-500 mt-1">تتبع كافة التكاليف النثرية والعمالة والنقل لهذا الفوج</p>
              </div>
              {flock.status === 'active' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 bg-farm-blue hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>إضافة مصروف للفوج</span>
                </button>
              )}
            </div>

            {isExpensesLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-farm-blue animate-spin" />
              </div>
            ) : expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <SaudiRiyalIcon size={48} className="text-emerald-700 mb-3" />
                <h3 className="text-base font-semibold text-gray-600">لا توجد مصروفات نثرية مسجلة للفوج</h3>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm font-semibold">
                        <th className="py-4 px-6">التاريخ</th>
                        <th className="py-4 px-6">الفئة</th>
                        <th className="py-4 px-6">المبلغ</th>
                        <th className="py-4 px-6">الوصف</th>
                        {flock.status === 'active' && <th className="py-4 px-6 text-left">إجراءات</th>}
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
                          {flock.status === 'active' && (
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
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Closing Allocations — only for completed flocks */}
      {flock.status === 'completed' && flock.closing_allocations && flock.closing_allocations.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">توزيع الإغلاق</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="text-right py-2 px-3 font-medium">الوجهة</th>
                  <th className="text-right py-2 px-3 font-medium">عدد الطيور</th>
                  <th className="text-right py-2 px-3 font-medium">النسبة %</th>
                  <th className="text-right py-2 px-3 font-medium">القيمة</th>
                </tr>
              </thead>
              <tbody>
                {flock.closing_allocations.map((alloc) => (
                  <tr key={alloc.id} className="border-b border-gray-50">
                    <td className="py-2 px-3 font-medium text-gray-900">
                      {alloc.allocation_label}
                    </td>
                    <td className="py-2 px-3">{alloc.bird_count.toLocaleString()}</td>
                    <td className="py-2 px-3">{Number(alloc.percentage).toFixed(3)}%</td>
                    <td className="py-2 px-3">
                      {alloc.value !== null && alloc.value !== undefined
                        ? Number(alloc.value).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Close Flock Dialog */}
      <CloseFlockDialog
        flockId={flockId}
        currentCount={flock.current_count}
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
      />

      {/* Add Modal */}
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
                <h3 className="text-lg font-bold text-gray-900">إضافة مصروف للفوج جديد</h3>
                <p className="text-xs text-gray-500">سيتم تدوينه في السجل المالي والتشغيلي للفوج</p>
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
                  <option value="خدمات تشغيلية">خدمات تشغيلية</option>
                  <option value="عمالة مؤقتة">عمالة مؤقتة</option>
                  <option value="نقل وتوصيل">نقل وتوصيل</option>
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
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-gray-900">{value}</span>
        {icon}
      </div>
    </div>
  )
}
