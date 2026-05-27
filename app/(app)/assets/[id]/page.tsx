'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { ArrowRight, Edit3, Loader2, Building2, MapPin, Calendar, DollarSign } from 'lucide-react'
import { useAsset } from '@/lib/hooks/useAssets'
import AssetTypeBadge from '@/components/assets/AssetTypeBadge'
import AssetStatusBadge from '@/components/assets/AssetStatusBadge'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'

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
        <h2 className="text-xl font-bold text-ink">لم يتم العثور على الأصل</h2>
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
        { label: 'قيمة الشراء', value: <span>{asset.purchase_value.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" /></span> },
        { label: 'القيمة الدفترية', value: <span>{asset.book_value.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" /></span> },
        { label: 'معدل الإهلاك', value: <span>{asset.calculation_rate.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" /></span> },
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
          <Link href="/assets" className="rounded-xl bg-surface-muted p-2 transition-colors hover:bg-surface-subtle">
            <ArrowRight className="w-5 h-5 text-ink-soft" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink">{asset.name}</h1>
            <p className="font-mono text-sm text-ink-muted">{asset.asset_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AssetTypeBadge category={asset.category} />
          <AssetStatusBadge status={asset.status} />
          <Link
            href={`/assets/${asset.id}/edit`}
            className="flex items-center gap-2 rounded-xl bg-action-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-action-primary-hover"
          >
            <Edit3 className="w-4 h-4" /> تعديل
          </Link>
        </div>
      </div>

      {/* Detail Sections */}
      {sections.map((section) => {
        const Icon = section.icon
        return (
          <div key={section.title} className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink-soft">
              <Icon className="w-4 h-4" /> {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {section.fields.map((f) => (
                <div key={f.label}>
                  <span className="mb-0.5 block text-xs text-ink-muted">{f.label}</span>
                  <span className="text-sm font-semibold text-ink">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Additional Details */}
      {asset.additional_details && Object.keys(asset.additional_details).length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-ink-soft">المواصفات الفرعية</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(asset.additional_details).filter(([k]) => k !== 'rooms').map(([key, value]) => (
              <div key={key}>
                <span className="mb-0.5 block text-xs text-ink-muted">{key}</span>
                <span className="text-sm font-semibold text-ink">{String(value)}</span>
              </div>
            ))}
          </div>
          {Array.isArray(asset.additional_details.rooms) && asset.additional_details.rooms.length > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <h3 className="mb-3 text-xs font-bold text-ink-muted">الغرف ({asset.additional_details.rooms.length})</h3>
              <div className="space-y-2">
                {asset.additional_details.rooms.map((room: any, i: number) => (
                  <div key={i} className="flex gap-4 rounded-xl bg-surface-subtle p-3 text-xs">
                    <span className="font-semibold text-ink">{room.room_name}</span>
                    <span className="text-ink-soft">{room.length}×{room.width} = {room.area} م²</span>
                    {room.ac_count > 0 && <span className="text-ink-soft">تكييف: {room.ac_count}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="flex items-center gap-6 text-xs text-ink-soft">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> أنشئ: {asset.created_at || '—'}</span>
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> آخر تعديل: {asset.updated_at || '—'}</span>
      </div>
    </div>
  )
}
