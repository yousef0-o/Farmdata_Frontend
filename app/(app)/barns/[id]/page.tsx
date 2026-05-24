'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Sprout, Loader2, ChevronRight, DollarSign, Plus, Trash2, Calendar, FileText, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { organizationApi } from '@/lib/api/organization'
import { useBarnExpenses, useCreateBarnExpense, useDeleteBarnExpense } from '@/lib/hooks/useExpenses'
import type { Flock } from '@/lib/types'

const typeLabels: Record<string, string> = {
  production: 'إنتاج',
  breeding: 'تربية',
}

const statusLabels: Record<string, string> = {
  active: 'نشط',
  completed: 'مكتمل',
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

  const [activeTab, setActiveTab] = useState<'flocks' | 'expenses'>('flocks')
  const [showAddModal, setShowAddModal] = useState(false)

  // Form states
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('صيانة')
  const [description, setDescription] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['barn', barnId],
    queryFn: () => organizationApi.getBarn(barnId),
  })

  const { data: expensesData, isLoading: isExpensesLoading } = useBarnExpenses(barnId)
  const createExpenseMutation = useCreateBarnExpense(barnId)
  const deleteExpenseMutation = useDeleteBarnExpense(barnId)

  const barn = data?.data

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

  const flocks: Flock[] = barn.active_flocks ?? []
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </Link>
          <div
            className={`p-3 rounded-xl ${
              barn.barn_type === 'production'
                ? 'bg-green-50 text-green-600'
                : 'bg-blue-50 text-blue-600'
            }`}
          >
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {barn.barn_name}
              </h1>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  barn.barn_type === 'production'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {typeLabels[barn.barn_type]}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {barn.capacity ? `السعة: ${barn.capacity}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('flocks')}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'flocks'
              ? 'border-farm-green text-farm-green'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          القطعان النشطة ({flocks.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-4 px-6 font-semibold text-sm transition-all border-b-2 ${
            activeTab === 'expenses'
              ? 'border-farm-green text-farm-green'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          سجل مصروفات الحظيرة
        </button>
      </div>

      {/* Flocks Tab Content */}
      {activeTab === 'flocks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">القطعان النشطة</h2>
            <Link
              href={`/flocks/new?barn_id=${barnId}`}
              className="flex items-center gap-2 bg-farm-green hover:bg-green-700 text-white px-5 py-2.5 rounded-xl transition-all font-medium"
            >
              <Sprout className="w-5 h-5" />
              <span>إضافة قطيع</span>
            </Link>
          </div>

          {flocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <Sprout className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600">
                لا توجد قطعان نشطة
              </h3>
              <p className="text-gray-500 mt-2">قم بإضافة قطيع جديد للبدء.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {flocks.map((flock) => (
                <Link key={flock.id} href={`/flocks/${flock.id}`}>
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          statusColors[flock.status] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {statusLabels[flock.status] ?? flock.status}
                      </span>
                      <span className="text-xs text-gray-500">{flock.entry_date}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">العدد المدخل</p>
                        <p className="text-lg font-bold text-gray-900">
                          {flock.entry_birds.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">العدد الحالي</p>
                        <p className="text-lg font-bold text-gray-900">
                          {flock.current_count.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {flock.breed && (
                      <p className="text-sm text-gray-500 mt-3">
                        السلالة: {flock.breed}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expenses Tab Content */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">مصروفات الحظيرة العامة</h2>
              <p className="text-sm text-gray-500 mt-1">تتبع التكاليف غير المرتبطة مباشرة بفوج معين</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-farm-blue hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة مصروف للحظيرة</span>
            </button>
          </div>

          {isExpensesLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-farm-blue animate-spin" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <DollarSign className="w-16 h-16 text-gray-300 mb-4" />
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
                          {Number(exp.amount).toLocaleString('ar-EG', { style: 'currency', currency: 'SAR' })}
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">إضافة مصروف حظيرة جديد</h3>
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
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-blue transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">المبلغ (SAR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-blue transition-all text-left font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">الفئة</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-blue transition-all font-semibold"
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
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-blue transition-all text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="flex-1 bg-farm-blue hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
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
        </div>
      )}
    </div>
  )
}
