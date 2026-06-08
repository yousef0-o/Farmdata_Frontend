'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Loader2, Trash2, Edit3 } from 'lucide-react'
import { useProductionEntries, useDeleteProductionEntry } from '@/lib/hooks/useDailyOps'
import { Button } from '@/components/ui/Button'
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
                      <Button asChild variant="ghost" size="icon" title="تعديل">
                        <Link href={`/flocks/${flockId}/daily/${entry.id}/edit`}>
                          <Edit3 className="w-4 h-4" />
                        </Link>
                      </Button>
                      {deleteConfirm === entry.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deleteEntry.isPending}
                            isLoading={deleteEntry.isPending}
                            loadingText="تأكيد"
                          >
                            تأكيد
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            إلغاء
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="danger"
                          size="icon"
                          aria-label="حذف السجل"
                          onClick={() => setDeleteConfirm(entry.id)}
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/flocks/${flockId}/daily/${entry.id}/edit`}>
                    تعديل
                  </Link>
                </Button>
                {deleteConfirm === entry.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleteEntry.isPending}
                      isLoading={deleteEntry.isPending}
                      loadingText="تأكيد"
                    >
                      تأكيد
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      إلغاء
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="danger"
                    size="icon"
                    aria-label="حذف السجل"
                    onClick={() => setDeleteConfirm(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
