'use client'

import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Sprout, Loader2, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { organizationApi } from '@/lib/api/organization'
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

  const { data, isLoading } = useQuery({
    queryKey: ['barn', barnId],
    queryFn: () => organizationApi.getBarn(barnId),
  })

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

  const backHref = barn.section_id
    ? `/sections/${barn.section_id}`
    : '/companies'

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Active Flocks */}
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
  )
}
