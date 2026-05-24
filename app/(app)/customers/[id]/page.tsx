'use client'

import React, { use } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, Building2, MapPin, Calendar, DollarSign, Phone, Users } from 'lucide-react'
import { useCustomer } from '@/lib/hooks/useCustomers'
import CustomerTypeBadge from '@/components/customers/CustomerTypeBadge'
import CustomerStatusBadge from '@/components/customers/CustomerStatusBadge'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: customerResponse, isLoading, error } = useCustomer(Number(id))
  const customer = customerResponse?.data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32" dir="rtl">
        <Loader2 className="w-10 h-10 text-farm-blue animate-spin" />
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center" dir="rtl">
        <h2 className="text-xl font-bold text-gray-800">لم يتم العثور على العميل</h2>
        <Link href="/customers" className="text-farm-blue hover:underline mt-4 text-sm">العودة لقائمة العملاء</Link>
      </div>
    )
  }

  const sections = [
    {
      title: 'البيانات الأساسية', icon: Building2,
      fields: [
        { label: 'كود العميل', value: customer.customer_code },
        { label: 'الاسم الكامل', value: customer.customer_name },
        { label: 'نوع العميل', value: customer.customer_type === 'company' ? 'شركة' : 'فرد' },
        { label: 'اسم الشركة', value: customer.company_name || '—' },
        { label: 'تاريخ التسجيل/الإصدار', value: customer.issue_date || '—' },
      ],
    },
    {
      title: 'البيانات المالية والائتمان', icon: DollarSign,
      fields: [
        { label: 'الحد الائتماني', value: customer.credit_limit === 0 ? 'بلا حد' : <span>{customer.credit_limit.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle" /></span> },
        { label: 'أيام الخصم المسموح بها', value: `${customer.discount_days} يوم` },
        { label: 'مبلغ الضمان المودع', value: <span>{customer.guarantee_amount.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle" /></span> },
        { label: 'معدل الخصم (%)', value: `${customer.discount_rate}%` },
        { label: 'خصم الدفع السريع (%)', value: `${customer.payment_discount}%` },
        { label: 'حد الخصم الأقصى', value: <span>{customer.discount_limit.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle" /></span> },
        { label: 'الرصيد الحالي المستحق', value: <span>{customer.current_balance.toLocaleString('en-US')} <SaudiRiyalIcon size={14} className="text-emerald-700 inline-block align-middle" /></span> },
        { label: 'الرقم الضريبي', value: customer.tax_number || '—' },
        { label: 'السجل التجاري', value: customer.commercial_record || '—' },
        { label: 'كود الحساب المالي', value: customer.account_code || '—' },
        { label: 'اسم الحساب المالي', value: customer.account_name || '—' },
      ],
    },
    {
      title: 'العنوان والاتصال', icon: Phone,
      fields: [
        { label: 'الهاتف الأساسي', value: customer.phone1 || '—' },
        { label: 'الهاتف الإضافي', value: customer.phone2 || '—' },
        { label: 'البريد الإلكتروني الأساسي', value: customer.email1 || '—' },
        { label: 'البريد الإلكتروني الإضافي', value: customer.email2 || '—' },
        { label: 'الفاكس الأساسي', value: customer.fax1 || '—' },
        { label: 'الفاكس الإضافي', value: customer.fax2 || '—' },
        { label: 'المندوب المسؤول', value: customer.salesman_name ? `[${customer.salesman_number}] ${customer.salesman_name}` : '—' },
        { label: 'منطقة المبيعات', value: customer.sales_area_name ? `[${customer.sales_area_code}] ${customer.sales_area_name}` : '—' },
      ],
    },
    {
      title: 'العنوان الوطني التفصيلي', icon: MapPin,
      fields: [
        { label: 'الدولة', value: customer.country || '—' },
        { label: 'المنطقة/المحافظة', value: customer.province || '—' },
        { label: 'الحي', value: customer.district || '—' },
        { label: 'الشارع الأساسي', value: customer.street_name || '—' },
        { label: 'رقم المبنى', value: customer.building_number || '—' },
        { label: 'الشارع الإضافي', value: customer.additional_street || '—' },
        { label: 'الرقم الإضافي للمبنى', value: customer.additional_number || '—' },
        { label: 'صندوق البريد', value: customer.po_box || '—' },
        { label: 'الرمز البريدي', value: customer.postal_code || '—' },
        { label: 'العنوان التفصيلي الكامل', value: customer.customer_address || '—' },
      ],
    },
    {
      title: 'مراجع الاتصال الإضافية', icon: Users,
      fields: [
        { label: 'اسم المرجع الأول', value: customer.reference1 || '—' },
        { label: 'هاتف المرجع الأول', value: customer.reference1_phone || '—' },
        { label: 'بريد المرجع الأول', value: customer.reference1_email || '—' },
        { label: 'اسم المرجع الثاني', value: customer.reference2 || '—' },
        { label: 'هاتف المرجع الثاني', value: customer.reference2_phone || '—' },
        { label: 'بريد المرجع الثاني', value: customer.reference2_email || '—' },
      ],
    },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/customers" className="p-2 bg-gray-100 rounded-xl hover:bg-gray-250 transition-all">
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.customer_name}</h1>
            <p className="text-sm text-gray-500 font-mono">{customer.customer_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CustomerTypeBadge type={customer.customer_type} />
          <CustomerStatusBadge isSuspended={customer.is_suspended} />
        </div>
      </div>

      {/* Detail Sections */}
      {sections.map((section) => {
        const Icon = section.icon
        return (
          <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
              <Icon className="w-4 h-4 ml-1.5" /> {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Timestamps */}
      <div className="flex items-center gap-6 text-xxs text-gray-500">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 ml-1" /> أنشئ: {customer.created_at || '—'}</span>
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 ml-1" /> آخر تعديل: {customer.updated_at || '—'}</span>
      </div>
    </div>
  )
}
