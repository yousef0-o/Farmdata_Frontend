'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { Stethoscope, Loader2 } from 'lucide-react'
import MedicalRecordForm from '@/components/medical/MedicalRecordForm'
import { useFlockMedicalRecord, useUpdateFlockMedicalRecord } from '@/lib/hooks/useFlockMedical'

export default function EditMedicalRecordPage() {
  const { id, recordId: recordIdParam } = useParams()
  const flockId = Number(id)
  const recordId = Number(recordIdParam)

  const { data: record, isLoading } = useFlockMedicalRecord(flockId, recordId)
  const updateMutation = useUpdateFlockMedicalRecord(flockId, recordId)

  const handleSubmit = async (data: any) => {
    await updateMutation.mutateAsync(data)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="text-center py-20 text-gray-500">
        السجل الطبي غير موجود أو لا ينتمي لهذا الفوج.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>الفوج #{flockId}</span>
          <span>/</span>
          <span>الملف الطبي</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">تعديل سجل طبي وصرف أدوية</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Stethoscope className="w-7 h-7 text-red-600" />
          تعديل السجل الطبي وصرف العلاج
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          تحديث الفحص، التشخيص، أو تعديل كميات الأدوية المصروفة وسيقوم النظام بتسوية أرصدة المخازن تلقائياً.
        </p>
      </div>

      <MedicalRecordForm
        flockId={flockId}
        initialData={record}
        onSubmit={handleSubmit}
        isPending={updateMutation.isPending}
      />
    </div>
  )
}
