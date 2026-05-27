'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Calendar, Trash2, Edit, Loader2, Stethoscope, AlertTriangle } from 'lucide-react'
import { useFlockMedicalRecords, useDeleteFlockMedicalRecord } from '@/lib/hooks/useFlockMedical'

interface MedicalRecordsTableProps {
  flockId: number
  isActive: boolean
}

export default function MedicalRecordsTable({ flockId, isActive }: MedicalRecordsTableProps) {
  const [page, setPage] = useState(1)
  const { data: recordsData, isLoading, refetch } = useFlockMedicalRecords(flockId, page)
  const deleteMutation = useDeleteFlockMedicalRecord(flockId)
  
  const records = recordsData?.data || []
  const meta = recordsData?.meta

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا السجل الطبي وإلغاء صرف الأدوية المصاحبة؟')) {
      return
    }
    try {
      await deleteMutation.mutateAsync(id)
      refetch()
    } catch (err: any) {
      alert(err?.message || 'فشل حذف السجل الطبي')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 flex flex-col items-center justify-center gap-3">
        <Stethoscope className="w-12 h-12 text-gray-300" />
        <p className="text-base font-medium">لا توجد سجلات طبية مسجلة لهذا الفوج بعد.</p>
        {isActive && (
          <Link
            href={`/flocks/${flockId}/medical/new`}
            className="mt-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors font-semibold border border-red-200"
          >
            تسجيل أول فحص طبي الآن
          </Link>
        )}
      </div>
    )
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            مرتفعة جداً
          </span>
        )
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            متوسطة
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
            منخفضة
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 shadow-sm lg:block">
        <table className="w-full text-sm text-right">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-700">
              <th className="py-3.5 px-4 font-semibold">التاريخ</th>
              <th className="py-3.5 px-4 font-semibold">الطبيب</th>
              <th className="py-3.5 px-4 font-semibold">الأعراض الإكلينيكية</th>
              <th className="py-3.5 px-4 font-semibold">التشخيص</th>
              <th className="py-3.5 px-4 font-semibold">درجة الخطورة</th>
              <th className="py-3.5 px-4 font-semibold">الأدوية المصروفة والجرعة</th>
              {isActive && <th className="py-3.5 px-4 font-semibold text-left">الإجراءات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4 font-semibold text-gray-900 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {record.record_date}
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-600 whitespace-nowrap">
                  {record.veterinarian || '—'}
                </td>
                <td className="py-4 px-4 text-gray-600 max-w-[200px] truncate" title={record.clinical_signs}>
                  {record.clinical_signs || '—'}
                </td>
                <td className="py-4 px-4 text-gray-900 font-medium max-w-[200px] truncate" title={record.diagnosis}>
                  {record.diagnosis || '—'}
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  {getSeverityBadge(record.severity)}
                </td>
                <td className="py-4 px-4 text-gray-600 max-w-[250px]">
                  {record.medications && record.medications.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {record.medications.map((med) => (
                        <div key={med.id} className="text-xs">
                          <span className="font-semibold text-gray-800">{med.medicine_name}</span>
                          {med.quantity !== undefined && med.quantity > 0 && (
                            <span className="text-gray-500 mr-1">
                              ({med.quantity} {med.inventory_item_name || 'وحدة'} من {med.warehouse_name || 'المستودع'})
                            </span>
                          )}
                          {med.dosage && (
                            <span className="text-farm-blue mr-1 font-medium">[{med.dosage}]</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">لا يوجد أدوية مصروفة</span>
                  )}
                </td>
                {isActive && (
                  <td className="py-4 px-4 whitespace-nowrap text-left">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/flocks/${flockId}/medical/${record.id}/edit`}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                        title="تعديل السجل"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(record.id)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                        title="حذف السجل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {records.map((record) => (
          <article key={record.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Calendar className="h-4 w-4 text-ink-muted" />
                  {record.record_date}
                </p>
                <p className="text-xs text-ink-soft">{record.veterinarian || '—'}</p>
              </div>
              {getSeverityBadge(record.severity)}
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">الأعراض الإكلينيكية</span>
                <span className="text-ink-soft">{record.clinical_signs || '—'}</span>
              </div>
              <div className="rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">التشخيص</span>
                <span className="font-semibold text-ink">{record.diagnosis || '—'}</span>
              </div>
              <div className="rounded-xl bg-surface-subtle px-3 py-2">
                <span className="block text-xs text-ink-muted">الأدوية المصروفة والجرعة</span>
                {record.medications && record.medications.length > 0 ? (
                  <div className="mt-1 flex flex-col gap-1">
                    {record.medications.map((med) => (
                      <div key={med.id} className="text-xs text-ink-soft">
                        <span className="font-semibold text-ink">{med.medicine_name}</span>
                        {med.quantity !== undefined && med.quantity > 0 ? (
                          <span className="mr-1 text-ink-muted">
                            ({med.quantity} {med.inventory_item_name || 'وحدة'} من {med.warehouse_name || 'المستودع'})
                          </span>
                        ) : null}
                        {med.dosage ? <span className="mr-1 font-medium text-action-primary">[{med.dosage}]</span> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-ink-muted">لا يوجد أدوية مصروفة</span>
                )}
              </div>
            </div>

            {isActive ? (
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/flocks/${flockId}/medical/${record.id}/edit`}
                  className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-info-soft bg-info-soft px-4 py-2 text-sm font-semibold text-action-primary"
                >
                  تعديل
                </Link>
                <button
                  onClick={() => handleDelete(record.id)}
                  disabled={deleteMutation.isPending}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-danger-soft bg-danger-soft px-4 py-2 text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {/* Pagination Controls */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-4 text-sm text-gray-600">
          <div>
            عرض {records.length} من أصل {meta.total} سجل
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              السابق
            </button>
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              صفحة {page} من {meta.last_page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={page === meta.last_page}
              className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
