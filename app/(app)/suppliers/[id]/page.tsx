'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, Building2, MapPin, Calendar, DollarSign, Phone, Users } from 'lucide-react'
import { useSupplier } from '@/lib/hooks/useSuppliers'
import SupplierStatusBadge from '@/components/suppliers/SupplierStatusBadge'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: supplierResponse, isLoading, error } = useSupplier(Number(id))
  const supplier = supplierResponse?.data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32" dir="rtl">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (error || !supplier) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center" dir="rtl">
        <h2 className="text-xl font-bold text-ink">لم يتم العثور على المورد</h2>
        <Link href="/suppliers" className="text-farm-blue hover:underline mt-4 text-sm">العودة لقائمة الموردين</Link>
      </div>
    )
  }

  const sections = [
    {
      title: 'البيانات الأساسية', icon: Building2,
      fields: [
        { label: 'كود المورد', value: supplier.supplier_code },
        { label: 'الاسم الكامل', value: supplier.supplier_name },
        { label: 'تاريخ التسجيل/الإصدار', value: supplier.issue_date || '—' },
      ],
    },
    {
      title: 'البيانات المالية والائتمان', icon: DollarSign,
      fields: [
        { label: 'الحد الائتماني', value: supplier.credit_limit === 0 ? 'بلا حد' : <span>{supplier.credit_limit.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" /></span> },
        { label: 'أيام الخصم المسموح بها', value: `${supplier.discount_days} يوم` },
        { label: 'مبلغ الضمان المودع', value: <span>{supplier.guarantee_amount.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" /></span> },
        { label: 'معدل الخصم (%)', value: `${supplier.discount_rate}%` },
        { label: 'الرصيد الحالي المستحق', value: <span>{supplier.current_balance.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle ml-1" /></span> },
        { label: 'الرقم الضريبي', value: supplier.tax_number || '—' },
        { label: 'كود الحساب المالي', value: supplier.account_code || '—' },
        { label: 'اسم الحساب المالي', value: supplier.account_name || '—' },
      ],
    },
    {
      title: 'الاتصال والتواصل', icon: Phone,
      fields: [
        { label: 'الهاتف الأساسي', value: supplier.phone1 || '—' },
        { label: 'الهاتف الإضافي', value: supplier.phone2 || '—' },
        { label: 'البريد الإلكتروني الأساسي', value: supplier.email1 || '—' },
        { label: 'البريد الإلكتروني الإضافي', value: supplier.email2 || '—' },
        { label: 'الفاكس الأساسي', value: supplier.fax1 || '—' },
        { label: 'الفاكس الإضافي', value: supplier.fax2 || '—' },
      ],
    },
    {
      title: 'العنوان الوطني التفصيلي', icon: MapPin,
      fields: [
        { label: 'الدولة', value: supplier.country || '—' },
        { label: 'المنطقة/المحافظة', value: supplier.province || '—' },
        { label: 'الحي', value: supplier.district || '—' },
        { label: 'الشارع الأساسي', value: supplier.street_name || '—' },
        { label: 'رقم المبنى', value: supplier.building_number || '—' },
        { label: 'الشارع الإضافي', value: supplier.additional_street || '—' },
        { label: 'الرقم الإضافي للمبنى', value: supplier.additional_number || '—' },
        { label: 'صندوق البريد', value: supplier.po_box || '—' },
        { label: 'الرمز البريدي', value: supplier.postal_code || '—' },
        { label: 'العنوان التفصيلي الكامل', value: supplier.customer_address || '—' },
      ],
    },
    {
      title: 'مراجع الاتصال الإضافية', icon: Users,
      fields: [
        { label: 'اسم المرجع الأول', value: supplier.reference1 || '—' },
        { label: 'هاتف المرجع الأول', value: supplier.reference1_phone || '—' },
        { label: 'بريد المرجع الأول', value: supplier.reference1_email || '—' },
        { label: 'اسم المرجع الثاني', value: supplier.reference2 || '—' },
        { label: 'هاتف المرجع الثاني', value: supplier.reference2_phone || '—' },
        { label: 'بريد المرجع الثاني', value: supplier.reference2_email || '—' },
      ],
    },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/suppliers" className="rounded-xl bg-surface-muted p-2 transition-colors hover:bg-surface-subtle">
            <ArrowRight className="w-5 h-5 text-ink-soft" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink">{supplier.supplier_name}</h1>
            <p className="font-mono text-sm text-ink-muted">{supplier.supplier_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SupplierStatusBadge isSuspended={supplier.is_suspended} />
        </div>
      </div>

      {/* Detail Sections */}
      {sections.map((section) => {
        const Icon = section.icon
        return (
          <div key={section.title} className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink-soft">
              <Icon className="w-4 h-4 ml-1.5" /> {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Timestamps */}
      <div className="flex items-center gap-6 text-xs text-ink-muted">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 ml-1" /> أنشئ: {supplier.created_at || '—'}</span>
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 ml-1" /> آخر تعديل: {supplier.updated_at || '—'}</span>
      </div>
    </div>
  )
}
