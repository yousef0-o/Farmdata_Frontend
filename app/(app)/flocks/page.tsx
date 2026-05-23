'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Loader2, Search, Bird, ArrowLeft } from 'lucide-react'
import { useFlocks } from '@/lib/hooks/useFlock'
import { FlockStatusBadge } from '@/components/flock/FlockStatusBadge'
import { FlockTypeBadge } from '@/components/flock/FlockTypeBadge'
import Pagination from '@/components/ui/Pagination'

export default function FlocksListPage() {
  const [selectedStatus, setSelectedStatus] = useState('')
  const [appliedStatus, setAppliedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: response, isLoading, isError, refetch } = useFlocks(
    appliedStatus || undefined,
    currentPage
  )

  const flocks = response?.data
  const meta = response?.meta

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    setAppliedStatus(selectedStatus)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bird className="w-7 h-7 text-farm-green" />
            إدارة الأفواج
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            عرض وتصفية جميع أفواج الدواجن النشطة والمكتملة والملغاة.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-end gap-4"
      >
        <div className="w-full sm:w-64 space-y-1.5">
          <label htmlFor="status-select" className="text-xs font-bold text-gray-700">
            حالة الفوج
          </label>
          <select
            id="status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-farm-blue text-sm"
          >
            <option value="">الكل</option>
            <option value="active">نشط</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-2.5 bg-farm-blue text-white rounded-xl hover:bg-farm-blue/90 font-medium transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Search className="w-4 h-4" />
          بحث
        </button>
      </form>

      {/* Main Table / Loader / Error */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between animate-pulse py-3 border-b border-gray-50 last:border-0">
                <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/6"></div>
                <div className="h-4 bg-gray-100 rounded w-1/12"></div>
                <div className="h-4 bg-gray-100 rounded w-1/12"></div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <p className="text-red-500 font-medium mb-3">حدث خطأ أثناء تحميل الأفواج.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : !flocks || flocks.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <Bird className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-lg text-gray-700 mb-1">لا توجد أفواج</p>
            <p className="text-sm text-gray-400">لم يتم العثور على أي أفواج مطابقة لمعايير البحث.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-medium bg-gray-50/50">
                    <th className="py-3.5 px-4">رقم الفوج</th>
                    <th className="py-3.5 px-4">العنبر</th>
                    <th className="py-3.5 px-4">القسم</th>
                    <th className="py-3.5 px-4">النوع</th>
                    <th className="py-3.5 px-4">الحالة</th>
                    <th className="py-3.5 px-4">عدد الطيور عند الدخول</th>
                    <th className="py-3.5 px-4">العدد الحالي</th>
                    <th className="py-3.5 px-4">تاريخ الدخول</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {flocks.map((flock) => (
                    <tr
                      key={flock.id}
                      className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors last:border-0"
                    >
                      <td className="py-4 px-4 font-bold text-gray-900">
                        #{flock.id}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {flock.barn?.barn_name ?? '—'}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {flock.barn?.section?.section_name ?? '—'}
                      </td>
                      <td className="py-4 px-4">
                        <FlockTypeBadge type={flock.flock_type} />
                      </td>
                      <td className="py-4 px-4">
                        <FlockStatusBadge status={flock.status} />
                      </td>
                      <td className="py-4 px-4 text-gray-700 font-medium">
                        {flock.entry_birds.toLocaleString('en-US')}
                      </td>
                      <td className="py-4 px-4 text-gray-700 font-medium">
                        {flock.current_count.toLocaleString('en-US')}
                      </td>
                      <td className="py-4 px-4 text-gray-600 font-outfit">
                        {flock.entry_date}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Link
                          href={`/flocks/${flock.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-farm-blue hover:text-farm-blue/80"
                        >
                          عرض
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && meta.last_page > 1 && (
              <div className="p-4 border-t border-gray-50">
                <Pagination
                  currentPage={currentPage}
                  lastPage={meta.last_page}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
