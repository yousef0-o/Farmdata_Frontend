'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Stethoscope } from 'lucide-react'
import MedicalRecordForm from '@/components/medical/MedicalRecordForm'
import { useCreateFlockMedicalRecord } from '@/lib/hooks/useFlockMedical'

export default function NewMedicalRecordPage() {
  const { id } = useParams()
  const flockId = Number(id)
  const createMutation = useCreateFlockMedicalRecord(flockId)

  const handleSubmit = async (data: any) => {
    await createMutation.mutateAsync(data)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>الفوج #{flockId}</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">تسجيل فحص وصرف علاج جديد</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Stethoscope className="w-7 h-7 text-red-600" />
          إضافة فحص طبي وصرف أدوية
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          تسجيل الأعراض الإكلينيكية، التشخيص النهائي، والجرعات مع خصم تلقائي من الأرصدة المخزنية للمستودعات.
        </p>
      </div>

      <MedicalRecordForm
        flockId={flockId}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending}
      />
    </div>
  )
}
