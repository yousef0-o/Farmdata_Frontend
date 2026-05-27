'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Loader2, Trash2, Edit3 } from 'lucide-react'
import { useProductionEntries, useDeleteProductionEntry } from '@/lib/hooks/useDailyOps'
import Pagination from '@/components/ui/Pagination'

interface ProductionEntriesTableProps {
  flockId: number
  isActive: boolean
}

export default function ProductionEntriesTable({ flockId, isActive }: ProductionEntriesTableProps) {
  const [page, setPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const { data, isLoading } = useProductionEntries(flockId, page)
  const deleteEntry = useDeleteProductionEntry(flockId)

  const entries = data?.data ?? []
  const meta = data?.meta

  const handleDelete = (entryId: number) => {
    deleteEntry.mutate(entryId, {
      onSuccess: () => setDeleteConfirm(null),
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-8 h-8 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-6">لا توجد سجلات يومية حتى الآن</p>
    )
  }

  return (
    <div>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500">
              <th className="text-right py-2 px-3 font-medium">التاريخ</th>
              <th className="text-right py-2 px-3 font-medium">عدد الطيور</th>
              <th className="text-right py-2 px-3 font-medium">النفوق</th>
              <th className="text-right py-2 px-3 font-medium">إجمالي البيض</th>
              <th className="text-right py-2 px-3 font-medium">معدل الإنتاج %</th>
              <th className="text-right py-2 px-3 font-medium">الهدف التشغيلي</th>
              <th className="text-right py-2 px-3 font-medium">العمر (يوم)</th>
              {isActive && <th className="text-right py-2 px-3 font-medium w-16"></th>}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-2 px-3 font-medium text-gray-900">{entry.record_date}</td>
                <td className="py-2 px-3">{entry.bird_count.toLocaleString()}</td>
                <td className="py-2 px-3">{entry.mortality}</td>
                <td className="py-2 px-3 font-medium">{entry.total_eggs.toLocaleString()}</td>
                <td className="py-2 px-3">
                  <span className="text-farm-blue font-medium">
                    {Number(entry.production_rate).toFixed(2)}%
                  </span>
                </td>
                <td className="py-2 px-3">{entry.operational_target}</td>
                <td className="py-2 px-3">{Number(entry.age_days)}</td>
                {isActive && (
                  <td className="py-2 px-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/flocks/${flockId}/daily/${entry.id}/edit`}
                        className="p-1 text-gray-400 hover:text-farm-blue transition-colors"
                        title="تعديل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      {deleteConfirm === entry.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(entry.id)}
                            disabled={deleteEntry.isPending}
                            className="text-xs text-red-600 hover:text-red-800 font-bold"
                          >
                            {deleteEntry.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'تأكيد'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(entry.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {entries.map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">{entry.record_date}</p>
                <p className="text-xs text-ink-muted">العمر {Number(entry.age_days)} يوم</p>
              </div>
              <div className="rounded-xl bg-surface-subtle px-3 py-2 text-right">
                <span className="block text-xs text-ink-muted">الهدف التشغيلي</span>
                <span className="text-sm font-semibold text-ink">{entry.operational_target}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">عدد الطيور</span>
                <span className="font-semibold text-ink">{entry.bird_count.toLocaleString()}</span>
              </div>
              <div className="rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">النفوق</span>
                <span className="font-semibold text-danger">{entry.mortality}</span>
              </div>
              <div className="rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">إجمالي البيض</span>
                <span className="font-semibold text-ink">{entry.total_eggs.toLocaleString()}</span>
              </div>
              <div className="rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">معدل الإنتاج</span>
                <span className="font-semibold text-action-primary">{Number(entry.production_rate).toFixed(2)}%</span>
              </div>
            </div>

            {isActive ? (
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/flocks/${flockId}/daily/${entry.id}/edit`}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-info-soft bg-info-soft px-4 py-2 text-sm font-semibold text-action-primary"
                >
                  تعديل
                </Link>
                {deleteConfirm === entry.id ? (
                  <div className="flex flex-1 items-center justify-between rounded-xl border border-danger-soft bg-danger-soft px-4 py-2 text-xs font-bold text-danger">
                    <button onClick={() => handleDelete(entry.id)} disabled={deleteEntry.isPending}>
                      {deleteEntry.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'تأكيد'}
                    </button>
                    <button onClick={() => setDeleteConfirm(null)}>إلغاء</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(entry.id)}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-danger-soft bg-danger-soft px-4 py-2 text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {meta && (
        <Pagination
          currentPage={meta.current_page}
          lastPage={meta.last_page}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
