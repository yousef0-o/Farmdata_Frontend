'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { ArrowRight, Edit3, Loader2, Building2, MapPin, Calendar, DollarSign } from 'lucide-react'
import { useAsset } from '@/lib/hooks/useAssets'
import AssetTypeBadge from '@/components/assets/AssetTypeBadge'
import AssetStatusBadge from '@/components/assets/AssetStatusBadge'

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: assetResponse, isLoading, error } = useAsset(Number(id))
  const asset = assetResponse?.data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32" dir="rtl">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center" dir="rtl">
        <h2 className="text-xl font-bold text-gray-800">لم يتم العثور على الأصل</h2>
        <Link href="/assets" className="text-farm-blue hover:underline mt-4 text-sm">العودة لقائمة الأصول</Link>
      </div>
    )
  }

  const sections = [
    {
      title: 'البيانات الأساسية', icon: Building2,
      fields: [
        { label: 'كود الأصل', value: asset.asset_code },
        { label: 'الاسم (عربي)', value: asset.name },
        { label: 'الاسم (إنجليزي)', value: asset.name_en || '—' },
        { label: 'التصنيف الفرعي', value: asset.sub_category || '—' },
        { label: 'طريقة الحساب', value: asset.calculation_type || '—' },
        { label: 'حُسب بواسطة', value: asset.calculated_by || '—' },
      ],
    },
    {
      title: 'البيانات المالية', icon: DollarSign,
      fields: [
        { label: 'قيمة الشراء', value: `${asset.purchase_value.toLocaleString('en-US')} ريال` },
        { label: 'القيمة الدفترية', value: `${asset.book_value.toLocaleString('en-US')} ريال` },
        { label: 'معدل الإهلاك', value: `${asset.calculation_rate.toLocaleString('en-US')} ريال` },
        { label: 'نسبة الإهلاك', value: `${asset.depreciation_percentage}%` },
        { label: 'تاريخ القيمة', value: asset.value_as_of || '—' },
      ],
    },
    {
      title: 'الموقع والتكلفة', icon: MapPin,
      fields: [
        { label: 'كود الموقع', value: asset.location_code || '—' },
        { label: 'اسم الموقع', value: asset.location_name || '—' },
        { label: 'كود مركز التكلفة', value: asset.cost_center_code || '—' },
        { label: 'اسم مركز التكلفة', value: asset.cost_center_name || '—' },
      ],
    },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/assets" className="p-2 bg-gray-100 rounded-xl hover:bg-gray-250 transition-all">
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-sm text-gray-500 font-mono">{asset.asset_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AssetTypeBadge category={asset.category} />
          <AssetStatusBadge status={asset.status} />
          <Link
            href={`/assets/${asset.id}/edit`}
            className="flex items-center gap-2 bg-farm-blue hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all"
          >
            <Edit3 className="w-4 h-4" /> تعديل
          </Link>
        </div>
      </div>

      {/* Detail Sections */}
      {sections.map((section) => {
        const Icon = section.icon
        return (
          <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
              <Icon className="w-4 h-4" /> {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {section.fields.map((f) => (
                <div key={f.label}>
                  <span className="text-xxs text-gray-500 block mb-0.5">{f.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Additional Details */}
      {asset.additional_details && Object.keys(asset.additional_details).length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 mb-4">المواصفات الفرعية</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(asset.additional_details).filter(([k]) => k !== 'rooms').map(([key, value]) => (
              <div key={key}>
                <span className="text-xxs text-gray-505 block mb-0.5">{key}</span>
                <span className="text-sm font-semibold text-gray-900">{String(value)}</span>
              </div>
            ))}
          </div>
          {Array.isArray(asset.additional_details.rooms) && asset.additional_details.rooms.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-bold text-gray-500 mb-3">الغرف ({asset.additional_details.rooms.length})</h3>
              <div className="space-y-2">
                {asset.additional_details.rooms.map((room: any, i: number) => (
                  <div key={i} className="flex gap-4 text-xs bg-gray-50 p-3 rounded-xl">
                    <span className="font-semibold text-gray-900">{room.room_name}</span>
                    <span className="text-gray-550">{room.length}×{room.width} = {room.area} م²</span>
                    {room.ac_count > 0 && <span className="text-gray-550">تكييف: {room.ac_count}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="flex items-center gap-6 text-xxs text-gray-550">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> أنشئ: {asset.created_at || '—'}</span>
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> آخر تعديل: {asset.updated_at || '—'}</span>
      </div>
    </div>
  )
}
