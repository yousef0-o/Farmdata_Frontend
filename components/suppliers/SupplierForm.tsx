'use client'

import React, { useState, useRef, useCallback } from 'react'
import { X, Loader2, AlertCircle, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import type { Supplier } from '@/lib/types'
import SaudiRiyalIcon from '@/components/icons/SaudiRiyalIcon'

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

  // ref دايمًا بيحمل آخر نسخة من form — بيحل مشكلة stale closure في React 18
  const formRef = useRef(form)

  const updateForm = useCallback((key: keyof Supplier, val: any) => {
    setForm((prev) => {
      const next = { ...prev, [key]: val }
      formRef.current = next
      return next
    })
  }, [])

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  const PHONE_REGEX = /^[+\d\s\-().]{7,20}$/

  const validateStep = (s: number): boolean => {
    const f = formRef.current   // دايمًا آخر قيمة بدون stale closure
    const errs: Record<string, string> = {}

    if (s === 0) {
      if (!f.supplier_code?.trim())
        errs.supplier_code = 'كود المورد مطلوب'
      if (!f.supplier_name?.trim())
        errs.supplier_name = 'اسم المورد مطلوب'

      if (f.email1 && !EMAIL_REGEX.test(f.email1))
        errs.email1 = 'صيغة البريد الإلكتروني غير صحيحة'
      if (f.email2 && !EMAIL_REGEX.test(f.email2))
        errs.email2 = 'صيغة البريد الإلكتروني غير صحيحة'

      if (f.phone1 && !PHONE_REGEX.test(f.phone1))
        errs.phone1 = 'صيغة رقم الهاتف غير صحيحة (أرقام ومسافات وشرطات فقط)'
      if (f.phone2 && !PHONE_REGEX.test(f.phone2))
        errs.phone2 = 'صيغة رقم الهاتف غير صحيحة (أرقام ومسافات وشرطات فقط)'
      if (f.fax1 && !PHONE_REGEX.test(f.fax1))
        errs.fax1 = 'صيغة رقم الفاكس غير صحيحة'
      if (f.fax2 && !PHONE_REGEX.test(f.fax2))
        errs.fax2 = 'صيغة رقم الفاكس غير صحيحة'
    }

    if (s === 1) {
      if (f.credit_limit === undefined || Number(f.credit_limit) < 0)
        errs.credit_limit = 'يجب إدخال حد ائتمان صحيح (صفر أو أكثر)'
      if (f.discount_days === undefined || Number(f.discount_days) < 0)
        errs.discount_days = 'يجب إدخال أيام خصم صحيحة'
      if (f.discount_rate !== undefined && (Number(f.discount_rate) < 0 || Number(f.discount_rate) > 100))
        errs.discount_rate = 'معدل الخصم يجب أن يكون بين 0 و 100'
      if (f.guarantee_amount !== undefined && Number(f.guarantee_amount) < 0)
        errs.guarantee_amount = 'مبلغ الضمان لا يمكن أن يكون سالبًا'

      if (f.reference1_email && !EMAIL_REGEX.test(f.reference1_email))
        errs.reference1_email = 'صيغة البريد الإلكتروني غير صحيحة'
      if (f.reference2_email && !EMAIL_REGEX.test(f.reference2_email))
        errs.reference2_email = 'صيغة البريد الإلكتروني غير صحيحة'
      if (f.reference1_phone && !PHONE_REGEX.test(f.reference1_phone))
        errs.reference1_phone = 'صيغة رقم الهاتف غير صحيحة'
      if (f.reference2_phone && !PHONE_REGEX.test(f.reference2_phone))
        errs.reference2_phone = 'صيغة رقم الهاتف غير صحيحة'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  const handlePrev = () => setStep((s) => Math.max(s - 1, 0))

  const allErrors = { ...errors, ...serverErrors }

  const handleSubmit = () => {
    if (!validateStep(step)) return
    const f = formRef.current
    // Whitelist and format payload before submitting
    const payload: Partial<Supplier> = {
      supplier_code: f.supplier_code,
      supplier_name: f.supplier_name,
      email1: f.email1 || null as any,
      email2: f.email2 || null as any,
      phone1: f.phone1 || null as any,
      phone2: f.phone2 || null as any,
      fax1: f.fax1 || null as any,
      fax2: f.fax2 || null as any,
      postal_code: f.postal_code || null as any,
      country: f.country || null as any,
      credit_limit: Number(f.credit_limit ?? 0),
      discount_days: Number(f.discount_days ?? 0),
      guarantee_amount: Number(f.guarantee_amount ?? 0),
      discount_rate: Number(f.discount_rate ?? 0),
      tax_number: f.tax_number || null as any,
      account_code: f.account_code || null as any,
      account_name: f.account_name || null as any,
      issue_date: f.issue_date || null as any,
      po_box: f.po_box || null as any,
      district: f.district || null as any,
      province: f.province || null as any,
      street_name: f.street_name || null as any,
      building_number: f.building_number || null as any,
      customer_address: f.customer_address || null as any,
      additional_street: f.additional_street || null as any,
      additional_number: f.additional_number || null as any,
      reference1: f.reference1 || null as any,
      reference2: f.reference2 || null as any,
      reference1_email: f.reference1_email || null as any,
      reference2_email: f.reference2_email || null as any,
      reference1_phone: f.reference1_phone || null as any,
      reference2_phone: f.reference2_phone || null as any,
    }
    onSubmit(payload)
  }

  const inp = (key: keyof Supplier, label: React.ReactNode, opts: { required?: boolean; type?: string; placeholder?: string; span?: number } = {}) => (
    <div className={opts.span ? `md:col-span-${opts.span}` : ''}>
      <label htmlFor={key} className="text-xs font-semibold text-gray-700 flex items-center gap-1 mb-1">
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
          updateForm(key, val)
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
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all text-gray-400">
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
                    ? 'bg-emerald-100 text-emerald-700 cursor-pointer dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-500 dark:text-gray-400'
                }`}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                {s.label}
              </button>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-200" />}
            </React.Fragment>
          ))}
        </div>

        {/* Body — div بدل form عشان نمنع أي submission عرضي */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {allErrors.non_field && (
            <div className="p-4 bg-red-100 border border-red-200 text-red-650 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 text-sm rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
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
                  {inp('credit_limit', <span className="flex items-center gap-0.5">الحد الائتماني (<SaudiRiyalIcon size={12} className="text-emerald-700" />)</span>, { type: 'number' })}
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
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
                إلغاء
              </button>
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={handleNext}
                  className="bg-farm-blue hover:bg-farm-blue/90 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> التالي
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={isPending}
                  className="bg-farm-blue hover:bg-farm-blue/90 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingSupplier ? 'حفظ التعديلات' : 'إضافة المورد'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}