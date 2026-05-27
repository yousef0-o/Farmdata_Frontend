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
        className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-end lg:gap-4"
      >
        <div className="w-full sm:w-56 lg:w-64 space-y-1.5">
          <label htmlFor="status-select" className="text-xs font-bold text-ink-soft">
            حالة الفوج
          </label>
          <select
            id="status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface-muted px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action-primary"
          >
            <option value="">الكل</option>
            <option value="active">نشط</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>

        <button
          type="submit"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-action-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-action-primary-hover sm:w-auto"
        >
          <Search className="w-4 h-4" />
          بحث
        </button>
      </form>

      {/* Main Table / Loader / Error */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b border-line py-3 last:border-0 animate-pulse">
                <div className="h-4 w-1/4 rounded bg-surface-muted"></div>
                <div className="h-4 w-1/6 rounded bg-surface-muted"></div>
                <div className="h-4 w-1/12 rounded bg-surface-muted"></div>
                <div className="h-4 w-1/12 rounded bg-surface-muted"></div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <p className="text-red-500 font-medium mb-3">حدث خطأ أثناء تحميل الأفواج.</p>
            <button
              onClick={() => refetch()}
              className="min-h-11 rounded-xl border border-line px-4 py-2 text-sm hover:bg-surface-muted"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : !flocks || flocks.length === 0 ? (
          <div className="p-16 text-center text-ink-muted">
            <Bird className="mx-auto mb-3 h-12 w-12 text-ink-muted" />
            <p className="mb-1 text-lg font-semibold text-ink-soft">لا توجد أفواج</p>
            <p className="text-sm text-ink-muted">لم يتم العثور على أي أفواج مطابقة لمعايير البحث.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-subtle font-medium text-ink-soft">
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
                      className="border-b border-line transition-colors hover:bg-surface-subtle last:border-0"
                    >
                      <td className="py-4 px-4 font-bold text-ink">
                        #{flock.id}
                      </td>
                      <td className="py-4 px-4 text-ink-soft">
                        {flock.barn?.barn_name ?? '—'}
                      </td>
                      <td className="py-4 px-4 text-ink-muted">
                        {flock.barn?.section?.section_name ?? '—'}
                      </td>
                      <td className="py-4 px-4">
                        <FlockTypeBadge type={flock.flock_type} />
                      </td>
                      <td className="py-4 px-4">
                        <FlockStatusBadge status={flock.status} />
                      </td>
                      <td className="py-4 px-4 font-medium text-ink-soft">
                        {flock.entry_birds.toLocaleString('en-US')}
                      </td>
                      <td className="py-4 px-4 font-medium text-ink-soft">
                        {flock.current_count.toLocaleString('en-US')}
                      </td>
                      <td className="py-4 px-4 font-outfit text-ink-muted">
                        {flock.entry_date}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Link
                          href={`/flocks/${flock.id}`}
                          className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-action-primary transition-colors hover:bg-info-soft hover:text-action-primary"
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

            <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
              {flocks.map((flock) => (
                <article
                  key={flock.id}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-ink">#{flock.id}</p>
                      <p className="text-sm text-ink-soft">{flock.barn?.barn_name ?? '—'}</p>
                      <p className="text-xs text-ink-muted">{flock.barn?.section?.section_name ?? '—'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <FlockStatusBadge status={flock.status} />
                      <FlockTypeBadge type={flock.flock_type} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-surface-subtle px-3 py-2">
                      <span className="block text-xs text-ink-muted">عدد الدخول</span>
                      <span className="font-semibold text-ink">{flock.entry_birds.toLocaleString('en-US')}</span>
                    </div>
                    <div className="rounded-xl bg-surface-subtle px-3 py-2">
                      <span className="block text-xs text-ink-muted">العدد الحالي</span>
                      <span className="font-semibold text-ink">{flock.current_count.toLocaleString('en-US')}</span>
                    </div>
                    <div className="col-span-2 rounded-xl bg-surface-subtle px-3 py-2">
                      <span className="block text-xs text-ink-muted">تاريخ الدخول</span>
                      <span className="font-semibold text-ink">{flock.entry_date}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/flocks/${flock.id}`}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-xl border border-info-soft bg-info-soft px-4 py-2 text-sm font-semibold text-action-primary"
                    >
                      عرض
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {meta && meta.last_page > 1 && (
              <div className="border-t border-line p-4">
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
