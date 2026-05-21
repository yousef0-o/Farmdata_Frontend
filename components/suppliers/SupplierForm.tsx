'use client'

import React, { useState } from 'react'
import { X, Loader2, AlertCircle, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import type { Supplier } from '@/lib/types'

interface SupplierFormProps {
  editingSupplier: Supplier | null
  onSubmit: (data: Partial<Supplier>) => void
  onClose: () => void
  isPending: boolean
  serverErrors: Record<string, string>
}

const STEPS = [
  { key: 'basic', label: 'البيانات الأساسية' },
  { key: 'financials_address', label: 'البيانات المالية والعناوين' },
]

function getInitialForm(supplier: Supplier | null): Partial<Supplier> {
  if (supplier) {
    return {
      supplier_code: supplier.supplier_code,
      supplier_name: supplier.supplier_name,
      email1: supplier.email1 || '',
      email2: supplier.email2 || '',
      phone1: supplier.phone1 || '',
      phone2: supplier.phone2 || '',
      fax1: supplier.fax1 || '',
      fax2: supplier.fax2 || '',
      postal_code: supplier.postal_code || '',
      country: supplier.country || '',
      credit_limit: supplier.credit_limit ?? 0,
      discount_days: supplier.discount_days ?? 0,
      guarantee_amount: supplier.guarantee_amount ?? 0,
      discount_rate: supplier.discount_rate ?? 0,
      tax_number: supplier.tax_number || '',
      account_code: supplier.account_code || '',
      account_name: supplier.account_name || '',
      issue_date: supplier.issue_date || '',
      po_box: supplier.po_box || '',
      district: supplier.district || '',
      province: supplier.province || '',
      street_name: supplier.street_name || '',
      building_number: supplier.building_number || '',
      customer_address: supplier.customer_address || '',
      additional_street: supplier.additional_street || '',
      additional_number: supplier.additional_number || '',
      reference1: supplier.reference1 || '',
      reference2: supplier.reference2 || '',
      reference1_email: supplier.reference1_email || '',
      reference2_email: supplier.reference2_email || '',
      reference1_phone: supplier.reference1_phone || '',
      reference2_phone: supplier.reference2_phone || '',
    }
  }
  return {
    supplier_code: `SUPP-${Date.now().toString().slice(-6)}`,
    supplier_name: '',
    email1: '', email2: '', phone1: '', phone2: '', fax1: '', fax2: '',
    postal_code: '', country: 'Saudi Arabia',
    credit_limit: 0, discount_days: 0, guarantee_amount: 0, discount_rate: 0,
    tax_number: '', account_code: '', account_name: '', issue_date: '',
    po_box: '', district: '', province: '', street_name: '', building_number: '', customer_address: '', additional_street: '', additional_number: '',
    reference1: '', reference2: '', reference1_email: '', reference2_email: '', reference1_phone: '', reference2_phone: '',
  }
}

export default function SupplierForm({ editingSupplier, onSubmit, onClose, isPending, serverErrors }: SupplierFormProps) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Partial<Supplier>>(() => getInitialForm(editingSupplier))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const allErrors = { ...errors, ...serverErrors }

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {}
    if (s === 0) {
      if (!form.supplier_code) errs.supplier_code = 'كود المورد مطلوب'
      if (!form.supplier_name) errs.supplier_name = 'اسم المورد مطلوب'
    }
    if (s === 1) {
      if (form.credit_limit === undefined || form.credit_limit < 0) {
        errs.credit_limit = 'يجب إدخال حد ائتمان صحيح (صفر أو أكثر)'
      }
      if (form.discount_days === undefined || form.discount_days < 0) {
        errs.discount_days = 'يجب إدخال أيام خصم صحيحة'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  const handlePrev = () => setStep((s) => Math.max(s - 1, 0))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < STEPS.length - 1) {
      handleNext()
      return
    }
    if (!validateStep(step)) return
    // Whitelist and format payload before submitting
    const payload: Partial<Supplier> = {
      supplier_code: form.supplier_code,
      supplier_name: form.supplier_name,
      email1: form.email1 || null as any,
      email2: form.email2 || null as any,
      phone1: form.phone1 || null as any,
      phone2: form.phone2 || null as any,
      fax1: form.fax1 || null as any,
      fax2: form.fax2 || null as any,
      postal_code: form.postal_code || null as any,
      country: form.country || null as any,
      credit_limit: Number(form.credit_limit ?? 0),
      discount_days: Number(form.discount_days ?? 0),
      guarantee_amount: Number(form.guarantee_amount ?? 0),
      discount_rate: Number(form.discount_rate ?? 0),
      tax_number: form.tax_number || null as any,
      account_code: form.account_code || null as any,
      account_name: form.account_name || null as any,
      issue_date: form.issue_date || null as any,
      po_box: form.po_box || null as any,
      district: form.district || null as any,
      province: form.province || null as any,
      street_name: form.street_name || null as any,
      building_number: form.building_number || null as any,
      customer_address: form.customer_address || null as any,
      additional_street: form.additional_street || null as any,
      additional_number: form.additional_number || null as any,
      reference1: form.reference1 || null as any,
      reference2: form.reference2 || null as any,
      reference1_email: form.reference1_email || null as any,
      reference2_email: form.reference2_email || null as any,
      reference1_phone: form.reference1_phone || null as any,
      reference2_phone: form.reference2_phone || null as any,
    }
    onSubmit(payload)
  }

  const inp = (key: keyof Supplier, label: string, opts: { required?: boolean; type?: string; placeholder?: string; span?: number } = {}) => (
    <div className={opts.span ? `md:col-span-${opts.span}` : ''}>
      <label htmlFor={key} className="text-xs font-semibold text-gray-700 block mb-1">
        {label} {opts.required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={key}
        type={opts.type || 'text'}
        step={opts.type === 'number' ? '0.01' : undefined}
        placeholder={opts.placeholder}
        className={`w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:ring-2 focus:ring-farm-blue focus:outline-none text-sm ${
          allErrors[key] ? 'border-red-500' : 'border-gray-200'
        }`}
        value={(form as any)[key] ?? ''}
        onChange={(e) => {
          const val = opts.type === 'number' ? (e.target.value === '' ? 0 : parseFloat(e.target.value)) : e.target.value
          setForm({ ...form, [key]: val })
        }}
      />
      {allErrors[key] && <p className="text-xxs text-red-500 mt-1">{allErrors[key]}</p>}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 text-right">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">الخطوة {step + 1} من {STEPS.length} — {STEPS[step].label}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-250 rounded-full transition-all text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 py-3 border-b border-gray-100 bg-white">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.key}>
              <button
                type="button"
                onClick={() => { if (i < step) setStep(i) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  i === step
                    ? 'bg-farm-blue text-white'
                    : i < step
                    ? 'bg-emerald-100 text-emerald-700 cursor-pointer'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                {s.label}
              </button>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-250" />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {allErrors.non_field && (
            <div className="p-4 bg-red-100 border border-red-200 text-red-650 text-sm rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-550" />
              <span>{allErrors.non_field}</span>
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {inp('supplier_code', 'كود المورد', { required: true })}
                {inp('supplier_name', 'اسم المورد', { required: true })}
                {inp('issue_date', 'تاريخ التسجيل/الإصدار', { type: 'date' })}
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">الاتصال والتواصل</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {inp('phone1', 'الهاتف الأساسي')}
                  {inp('phone2', 'الهاتف الإضافي')}
                  {inp('email1', 'البريد الإلكتروني الأساسي')}
                  {inp('email2', 'البريد الإلكتروني الإضافي')}
                  {inp('fax1', 'الفاكس 1')}
                  {inp('fax2', 'الفاكس 2')}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Financials, Address, and References */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">البيانات المالية وحسابات الأستاذ</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {inp('credit_limit', 'الحد الائتماني (ريال)', { type: 'number' })}
                  {inp('discount_days', 'أيام الخصم المسموح بها', { type: 'number' })}
                  {inp('guarantee_amount', 'مبلغ الضمان', { type: 'number' })}
                  {inp('discount_rate', 'معدل الخصم (%)', { type: 'number' })}
                  {inp('tax_number', 'الرقم الضريبي')}
                  {inp('account_code', 'كود الحساب في الدليل')}
                  {inp('account_name', 'اسم الحساب في الدليل')}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">العنوان الوطني والتفاصيل الجغرافية</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {inp('country', 'الدولة')}
                  {inp('province', 'المنطقة/المحافظة')}
                  {inp('district', 'الحي')}
                  {inp('street_name', 'اسم الشارع')}
                  {inp('building_number', 'رقم المبنى')}
                  {inp('additional_street', 'اسم الشارع الإضافي')}
                  {inp('additional_number', 'الرقم الإضافي للمبنى')}
                  {inp('po_box', 'صندوق البريد')}
                  {inp('postal_code', 'الرمز البريدي')}
                  {inp('customer_address', 'العنوان الكامل بالتفصيل', { span: 2 })}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">مراجع الاتصال الإضافية</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {inp('reference1', 'المرجع الأول (الاسم)')}
                  {inp('reference1_phone', 'هاتف المرجع الأول')}
                  {inp('reference1_email', 'بريد المرجع الأول')}
                  {inp('reference2', 'المرجع الثاني (الاسم)')}
                  {inp('reference2_phone', 'هاتف المرجع الثاني')}
                  {inp('reference2_email', 'بريد المرجع الثاني')}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div>
              {step > 0 && (
                <button type="button" onClick={handlePrev}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-medium">
                  السابق <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="bg-gray-100 hover:bg-gray-250 text-gray-600 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
                إلغاء
              </button>
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={handleNext}
                  className="bg-farm-blue hover:bg-blue-800 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> التالي
                </button>
              ) : (
                <button type="submit" disabled={isPending}
                  className="bg-farm-blue hover:bg-blue-800 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingSupplier ? 'حفظ التعديلات' : 'إضافة المورد'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
