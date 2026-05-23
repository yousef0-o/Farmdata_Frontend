'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle } from 'lucide-react'
import { useFlock } from '@/lib/hooks/useFlock'
import { FlockStatusBadge } from '@/components/flock/FlockStatusBadge'
import { FlockTypeBadge } from '@/components/flock/FlockTypeBadge'
import ProductionEntryForm from '@/components/daily/ProductionEntryForm'
import BreedingEntryForm from '@/components/daily/BreedingEntryForm'

export default function DailyEntryNewPage() {
  const { id } = useParams()
  const router = useRouter()
  const flockId = Number(id)
  const { data: flockData, isLoading } = useFlock(flockId)

  const flock = flockData?.data

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

  const isProduction = flock.flock_type === 'production'
  const barn = flock.barn
  const section = barn?.section

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/companies" className="hover:text-gray-700">الشركات</Link>
          {section && (
            <>
              <span>/</span>
              <Link href={`/sections/${section.id}`} className="hover:text-gray-700">{section.section_name}</Link>
            </>
          )}
          {barn && (
            <>
              <span>/</span>
              <Link href={`/barns/${barn.id}`} className="hover:text-gray-700">{barn.barn_name}</Link>
            </>
          )}
          <span>/</span>
          <Link href={`/flocks/${flockId}`} className="hover:text-gray-700">
            {isProduction ? 'فوج إنتاج' : 'فوج تربية'} #{flockId}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">تسجيل يومي</span>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-gray-900">تسجيل يومي جديد</h1>
          <FlockStatusBadge status={flock.status} />
          <FlockTypeBadge type={flock.flock_type} />
        </div>
      </div>

      {/* Closed flock guard */}
      {flock.status !== 'active' ? (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">
            الفوج مغلق ولا يمكن إضافة تسجيلات جديدة
          </p>
        </div>
      ) : isProduction ? (
        <ProductionEntryForm
          flockId={flockId}
          onSuccess={() => router.push(`/flocks/${flockId}`)}
          onCancel={() => router.push(`/flocks/${flockId}`)}
        />
      ) : (
        <BreedingEntryForm
          flockId={flockId}
          onSuccess={() => router.push(`/flocks/${flockId}`)}
          onCancel={() => router.push(`/flocks/${flockId}`)}
        />
      )}
    </div>
  )
}
